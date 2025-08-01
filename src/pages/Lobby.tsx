import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { useGameState, useGameActions, useLobbyActions, useGameSync } from '@/hooks/useGameAtoms';
import { gameSyncInstanceAtom } from '@/state';
import type { AtomGameSync } from '@/lib/atomGameSync';
import UnifiedVideoRoom from '@/components/UnifiedVideoRoom';
import AlertBanner from '@/components/AlertBanner';
import ConfirmationModal from '@/components/ConfirmationModal';
import type { LobbyParticipant } from '@/state';

export default function TrueLobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = useGameState();
  const { startGame, createVideoRoom, endVideoRoom, generateDailyToken, loadGameState, setHostConnected } = useGameActions();
  const { myParticipant, setParticipant } = useLobbyActions();
  
  // Initialize game sync
  useGameSync();
  
  // Get sync instance for cleanup
  const gameSyncInstance = useAtomValue(gameSyncInstanceAtom) as AtomGameSync | null;

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [showAlert, setShowAlert] = useState(false);
  const [showSessionStartModal, setShowSessionStartModal] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [roomStatusLog, setRoomStatusLog] = useState<string[]>([]);

  // Function to show alerts and log room status
  const showAlertMessage = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    
    // Also log to room status
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    setRoomStatusLog(prev => [
      `${timestamp}: ${message}`,
      ...prev.slice(0, 9) // Keep last 10 entries
    ]);
  }, []);

  // Automatically create the video room when the host PC opens the lobby
  useEffect(() => {
    if (
      myParticipant?.type === 'host-pc' &&
      !state.videoRoomCreated &&
      !isCreatingRoom &&
      gameId
    ) {
      console.log('Host PC auto-creating video room...');
      setIsCreatingRoom(true);
      createVideoRoom(gameId)
        .then((result) => {
          if (result.success) {
            showAlertMessage('تم إنشاء غرفة الفيديو تلقائياً', 'success');
          } else {
            showAlertMessage(`فشل في إنشاء غرفة الفيديو: ${result.error}`, 'error');
          }
        })
        .finally(() => setIsCreatingRoom(false));
    }
  }, [myParticipant?.type, state.videoRoomCreated, gameId, createVideoRoom, isCreatingRoom, showAlertMessage]);

  // Use global video room state
  const videoRoomCreated = state.videoRoomCreated || false;

  // Initialize game and determine my role
  useEffect(() => {
    if (!gameId) return;

    // Load game state from database if needed
    const initializeGameState = async () => {
      if (state.gameId !== gameId) {
        console.log('Loading game state for:', gameId);
        try {
          const result = await loadGameState(gameId);
          if (!result.success) {
            console.error('Failed to load game state:', result.error);
            showAlertMessage(`فشل في تحميل بيانات الجلسة: ${result.error}`, 'error');
          }
        } catch (error) {
          console.error('Error loading game state:', error);
          showAlertMessage('خطأ في تحميل بيانات الجلسة', 'error');
        }
      }
    };

    initializeGameState();

    // Determine my role from URL parameters
    const role = searchParams.get('role');
    const name = searchParams.get('name');
    const flag = searchParams.get('flag');
    const club = searchParams.get('club');
    const hostName = searchParams.get('hostName');
    const autoJoin = searchParams.get('autoJoin') === 'true';

    let participant: LobbyParticipant | null = null;

    if (role === 'host') {
      // PC Host (control only)
      participant = {
        id: 'host-pc',
        name: hostName || state.hostName || 'المقدم',
        type: 'host-pc',
        isConnected: true,
      };
      // Mark host as connected
      setHostConnected(true);
    } else if (role === 'host-mobile') {
      // Mobile Host (with video)
      participant = {
        id: 'host-mobile',
        name: name || state.hostName || 'المقدم',
        type: 'host-mobile',
        isConnected: true,
      };
      // Mark host as connected
      setHostConnected(true);
    } else if (role === 'playerA' || role === 'playerB') {
      // Player - try to set participant even if some data is missing from URL
      participant = {
        id: role,
        name: name || 'لاعب',
        type: 'player',
        playerId: role,
        flag: flag || undefined,
        club: club || undefined,
        isConnected: true,
      };

      // Auto-join logic for players
      if (autoJoin) {
        console.log('Auto-joining player:', { role, name, flag, club });
        // This is handled by the database insertion in Join.tsx
        // The real-time sync will update the player state here
      }
    }

    setParticipant(participant);
    
    // Set up cleanup when user leaves the page
    const handleBeforeUnload = () => {
      if (participant && gameSyncInstance) {
        // Mark participant as disconnected
        gameSyncInstance.disconnect().catch(console.error);
        
        // Mark host as disconnected if this is a host
        if (participant.type === 'host-pc' || participant.type === 'host-mobile') {
          setHostConnected(false);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && participant && gameSyncInstance) {
        // User switched tabs or minimized - may indicate they're leaving
        // Don't disconnect immediately, but mark as potentially leaving
        setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            // Still hidden after 30 seconds, likely left
            console.log('User appears to have left, cleaning up presence...');
          }
        }, 30000);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Mark host as disconnected when leaving lobby
      if (myParticipant && (myParticipant.type === 'host-pc' || myParticipant.type === 'host-mobile')) {
        setHostConnected(false);
      }
    };
  }, [gameId, searchParams, state.gameId, state.hostName, loadGameState, setParticipant, gameSyncInstance, showAlertMessage, myParticipant, setHostConnected]);

  // Create video room when host PC clicks button
  const handleCreateVideoRoom = async () => {
    if (!gameId) return;

    setIsCreatingRoom(true);
    try {
      const result = await createVideoRoom(gameId);
      if (!result.success) {
        console.error('Failed to create room:', result.error);
        showAlertMessage(`فشل في إنشاء غرفة الفيديو: ${result.error}`, 'error');
      } else {
        showAlertMessage('تم إنشاء غرفة الفيديو بنجاح', 'success');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      showAlertMessage('خطأ في إنشاء غرفة الفيديو', 'error');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleEndVideoRoom = async () => {
    if (!gameId) return;

    try {
      await endVideoRoom(gameId);
      showAlertMessage('تم إنهاء غرفة الفيديو', 'info');
    } catch (error) {
      console.error('Error ending room:', error);
      showAlertMessage('خطأ في إنهاء غرفة الفيديو', 'error');
    }
  };

  const handleStartGame = () => {
    navigate(`/game/${gameId}?role=host`);
  };

  const handleStartSession = async () => {
    setIsStartingSession(true);
    try {
      // Start the game session (this will change phase to PLAYING)
      startGame();
      setShowSessionStartModal(false);
      showAlertMessage('تم بدء الجلسة بنجاح!', 'success');
      
      // Navigate to the game room
      setTimeout(() => {
        navigate(`/game/${gameId}?role=host`);
      }, 1500);
    } catch (error) {
      console.error('Failed to start session:', error);
      showAlertMessage('فشل في بدء الجلسة', 'error');
    } finally {
      setIsStartingSession(false);
    }
  };

  // Track player connections and show alerts
  const previousConnectedPlayerIds = useRef<Set<string>>(new Set());
  const hasShownSessionStartModal = useRef(false);
  const previousVideoRoomState = useRef<{ created: boolean; url?: string }>({ created: false });

  // Track video room state changes
  useEffect(() => {
    const currentState = { created: state.videoRoomCreated, url: state.videoRoomUrl };
    const previousState = previousVideoRoomState.current;

    if (currentState.created !== previousState.created) {
      if (currentState.created) {
        showAlertMessage('تم إنشاء غرفة الفيديو بنجاح', 'success');
      } else {
        showAlertMessage('تم حذف غرفة الفيديو', 'info');
      }
    }

    if (currentState.url !== previousState.url && currentState.url) {
      showAlertMessage('تم تحديث رابط غرفة الفيديو', 'info');
    }

    previousVideoRoomState.current = currentState;
  }, [state.videoRoomCreated, state.videoRoomUrl, showAlertMessage]);

  useEffect(() => {
    if (myParticipant?.type === 'host-pc') {
      const currentConnectedPlayers = Object.values(state.players).filter(p => p.isConnected && p.name);
      const currentConnectedPlayerIds = new Set(currentConnectedPlayers.map(p => p.id));

      // Detect newly joined players
      currentConnectedPlayers.forEach(player => {
        if (!previousConnectedPlayerIds.current.has(player.id)) {
          showAlertMessage(`انضم ${player.name} للعبة`, 'success');
        }
      });

      // Show session start modal when first player joins and video room is ready
      if (
        currentConnectedPlayers.length >= 1 && 
        state.videoRoomCreated && 
        state.phase === 'LOBBY' &&
        !hasShownSessionStartModal.current
      ) {
        setShowSessionStartModal(true);
        hasShownSessionStartModal.current = true;
      }

      // Update the previous state
      previousConnectedPlayerIds.current = currentConnectedPlayerIds;
    }
  }, [state.players, state.videoRoomCreated, state.phase, myParticipant, showAlertMessage]);

  if (!myParticipant || !gameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 flex items-center justify-center">
        <div className="text-white text-center font-arabic">
          <div className="w-8 h-8 border-2 border-accent2 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg mb-2">جاري تحميل الصالة...</p>
          {!gameId && <p className="text-sm text-white/70">لا يوجد معرف للعبة</p>}
          {!myParticipant && gameId && (
            <div className="text-sm text-white/70">
              <p>جاري تحديد هويتك...</p>
              <p className="text-xs mt-1">
                الدور: {searchParams.get('role') || 'غير محدد'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const connectedPlayers = Object.values(state.players).filter(
    (p) => p.isConnected,
  ).length;
  const hostMobileConnected = myParticipant.type === 'host-mobile' || false; // TODO: Track this in global state

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 p-4">
      {/* Alert Banner */}
      <AlertBanner
        message={alertMessage}
        type={alertType}
        isVisible={showAlert}
        onClose={() => setShowAlert(false)}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header - Same for everyone */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-arabic">
            صالة الانتظار
          </h1>
          <div className="space-y-2">
            <p className="text-accent2 font-arabic">
              رمز الجلسة: <span className="font-mono text-2xl">{gameId}</span>
            </p>
            <p className="text-white/70 font-arabic">
              اللاعبون المتصلون: {connectedPlayers}/2
            </p>
          </div>
        </div>

        {/* Host PC Controls */}
        {myParticipant.type === 'host-pc' && (
          <div className="mb-8 bg-blue-500/20 rounded-xl p-6 border border-blue-500/30">
            <h3 className="text-xl font-bold text-blue-300 mb-4 font-arabic text-center">
              تحكم المقدم
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-white font-arabic mb-2">إعدادات الأسئلة:</p>
                <div className="text-sm text-white/70 font-arabic space-y-1">
                  {Object.entries(state.segmentSettings).map(
                    ([segmentCode, count]) => (
                      <div key={segmentCode} className="flex justify-between">
                        <span>{segmentCode}:</span>
                        <span>{count} سؤال</span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div>
                <p className="text-white font-arabic mb-2">رموز الانضمام:</p>
                <div className="text-sm text-white/70 font-arabic space-y-1">
                  <p>
                    رمز المقدم (للهاتف):{' '}
                    <span className="font-mono text-blue-300">
                      {state.hostCode}
                    </span>
                  </p>
                  <p>
                    رمز اللاعبين:{' '}
                    <span className="font-mono text-blue-300">{gameId}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              {!videoRoomCreated ? (
                <button
                  onClick={handleCreateVideoRoom}
                  disabled={isCreatingRoom}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-arabic transition-colors"
                >
                  {isCreatingRoom
                    ? 'جاري إنشاء غرفة الفيديو...'
                    : 'إنشاء غرفة الفيديو'}
                </button>
              ) : (
                <>
                  <div className="px-6 py-3 bg-green-600 text-white rounded-lg font-arabic">
                    ✓ غرفة الفيديو جاهزة
                  </div>
                  <button
                    onClick={handleEndVideoRoom}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-arabic transition-colors"
                  >
                    إنهاء غرفة الفيديو
                  </button>
                </>
              )}

              <button
                onClick={handleStartGame}
                disabled={connectedPlayers < 1 || !videoRoomCreated}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-arabic transition-colors"
              >
                {connectedPlayers < 1 
                  ? 'في انتظار اللاعبين...' 
                  : !videoRoomCreated 
                    ? 'في انتظار غرفة الفيديو...'
                    : 'بدء اللعبة'}
              </button>
            </div>
          </div>
        )}

        {/* Video Room Status Debug Panel - For All Users */}
        <div className="mb-8 bg-gray-800/50 rounded-xl p-6 border border-gray-600/30">
          <h3 className="text-xl font-bold text-gray-300 mb-4 font-arabic text-center">
            حالة غرفة الفيديو - معلومات تشخيصية
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-sm font-bold text-gray-300 mb-2 font-arabic">حالة الغرفة</h4>
              <div className="space-y-1 text-sm">
                <div className={`flex items-center gap-2 ${videoRoomCreated ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${videoRoomCreated ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="font-arabic">{videoRoomCreated ? 'تم إنشاء الغرفة' : 'لم يتم إنشاء الغرفة'}</span>
                </div>
                <div className="text-gray-400 font-arabic">
                  URL: {state.videoRoomUrl ? (
                    <a href={state.videoRoomUrl} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-400 hover:text-blue-300 break-all text-xs">
                      {state.videoRoomUrl}
                    </a>
                  ) : 'غير متوفر'}
                </div>
              </div>
            </div>

            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-sm font-bold text-gray-300 mb-2 font-arabic">معلومات المستخدم</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <div className="font-arabic">النوع: {myParticipant?.type || 'غير محدد'}</div>
                <div className="font-arabic">الاسم: {myParticipant?.name || 'غير محدد'}</div>
                <div className="font-arabic">المعرف: {myParticipant?.id || 'غير محدد'}</div>
              </div>
            </div>

            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-sm font-bold text-gray-300 mb-2 font-arabic">إحصائيات</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <div className="font-arabic">اللاعبون المتصلون: {connectedPlayers}/2</div>
                <div className="font-arabic">مرحلة اللعبة: {state.phase}</div>
                <div className="font-arabic">معرف الجلسة: {gameId}</div>
              </div>
            </div>
          </div>

          {/* Debug Control Buttons */}
          <div className="border-t border-gray-600/30 pt-4">
            <h4 className="text-sm font-bold text-gray-300 mb-3 font-arabic">أدوات التشخيص والتحكم</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={handleCreateVideoRoom}
                disabled={isCreatingRoom || videoRoomCreated}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-arabic transition-colors"
              >
                {isCreatingRoom ? 'جاري الإنشاء...' : 'إنشاء غرفة'}
              </button>
              
              <button
                onClick={handleEndVideoRoom}
                disabled={!videoRoomCreated}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-arabic transition-colors"
              >
                حذف الغرفة
              </button>

              <button
                onClick={() => {
                  if (state.videoRoomUrl) {
                    window.open(state.videoRoomUrl, '_blank');
                  } else {
                    showAlertMessage('لا يوجد رابط غرفة فيديو', 'error');
                  }
                }}
                disabled={!state.videoRoomUrl}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-arabic transition-colors"
              >
                فتح في Daily.co
              </button>

              <button
                onClick={async () => {
                  if (!gameId || !myParticipant) return;
                  
                  try {
                    // Generate a fresh token for manual joining
                    const token = await generateDailyToken(
                      gameId,
                      myParticipant.name,
                      myParticipant.type === 'host-mobile'
                    );
                    
                    if (token && state.videoRoomUrl) {
                      // Create URL with token for manual join
                      const joinUrl = `${state.videoRoomUrl}?t=${token}`;
                      window.open(joinUrl, '_blank');
                      showAlertMessage('تم فتح رابط انضمام مباشر', 'success');
                    } else {
                      showAlertMessage('فشل في توليد رمز الدخول', 'error');
                    }
                  } catch (error) {
                    console.error('Error generating manual join token:', error);
                    showAlertMessage('خطأ في توليد رمز الدخول', 'error');
                  }
                }}
                disabled={!state.videoRoomUrl || !myParticipant}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-arabic transition-colors"
              >
                انضمام مباشر
              </button>

              <button
                onClick={() => {
                  // Force refresh of room status
                  window.location.reload();
                }}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-arabic transition-colors"
              >
                تحديث الصفحة
              </button>
            </div>

            {/* Additional debug info for troubleshooting */}
            <div className="mt-4 space-y-3">
              {/* Live Activity Log */}
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <h5 className="text-sm font-bold text-gray-300 mb-2 font-arabic">سجل النشاطات المباشرة</h5>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {roomStatusLog.length > 0 ? (
                    roomStatusLog.map((entry, index) => (
                      <div key={index} className="text-xs text-gray-400 font-arabic bg-gray-800/50 px-2 py-1 rounded">
                        {entry}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 font-arabic">لا توجد أنشطة حتى الآن</div>
                  )}
                </div>
              </div>

              {/* Technical Details */}
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <details className="text-sm">
                  <summary className="text-gray-300 font-arabic cursor-pointer hover:text-white">
                    معلومات تقنية إضافية (للمطورين)
                  </summary>
                  <div className="mt-2 space-y-1 text-xs text-gray-500 font-mono">
                    <div>Game State: {JSON.stringify({ 
                      videoRoomCreated: state.videoRoomCreated,
                      videoRoomUrl: state.videoRoomUrl,
                      phase: state.phase
                    }, null, 2)}</div>
                    <div>My Participant: {JSON.stringify(myParticipant, null, 2)}</div>
                    <div>Connected Players: {JSON.stringify(Object.values(state.players).filter(p => p.isConnected), null, 2)}</div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* Player notification when no video room exists */}
        {myParticipant.type === 'player' && !videoRoomCreated && (
          <div className="mb-8 bg-orange-500/20 rounded-xl p-6 border border-orange-500/30">
            <h3 className="text-xl font-bold text-orange-300 mb-4 font-arabic text-center">
              إشعار للاعب
            </h3>
            <div className="text-center text-white">
              <p className="font-arabic mb-3">
                لا توجد غرفة فيديو حالياً. 
                {isCreatingRoom 
                  ? ' جاري إنشاء غرفة الفيديو تلقائياً...' 
                  : ' يرجى انتظار المقدم لإنشاء الغرفة أو سيتم إنشاؤها تلقائياً.'}
              </p>
              {isCreatingRoom && (
                <div className="w-6 h-6 border-2 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
              )}
            </div>
          </div>
        )}

        {/* Unified Video Conference - All participants in one room */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-800/30 to-purple-800/30 rounded-xl p-6 border border-blue-500/30">
            <h3 className="text-xl font-bold text-blue-300 mb-4 font-arabic text-center">
              غرفة الفيديو الموحدة - جميع المشاركين
            </h3>
            
            <div className="mb-4">
              <UnifiedVideoRoom 
                gameId={gameId}
                className="w-full aspect-video"
              />
            </div>
            
            {/* Participant status indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* Host Status */}
              <div className="bg-blue-600/20 rounded-lg p-3 text-center">
                <div className="text-blue-300 font-bold mb-1 font-arabic">المقدم</div>
                <div className="text-white font-arabic">{state.hostName}</div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    hostMobileConnected ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-xs text-white/70 font-arabic">
                    {hostMobileConnected ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
              </div>
              
              {/* Player A Status */}
              <div className="bg-green-600/20 rounded-lg p-3 text-center">
                <div className="text-green-300 font-bold mb-1 font-arabic">لاعب 1</div>
                <div className="text-white font-arabic">
                  {state.players.playerA.name || 'لم ينضم بعد'}
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    state.players.playerA.isConnected ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-xs text-white/70 font-arabic">
                    {state.players.playerA.isConnected ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
              </div>
              
              {/* Player B Status */}
              <div className="bg-purple-600/20 rounded-lg p-3 text-center">
                <div className="text-purple-300 font-bold mb-1 font-arabic">لاعب 2</div>
                <div className="text-white font-arabic">
                  {state.players.playerB.name || 'لم ينضم بعد'}
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    state.players.playerB.isConnected ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-xs text-white/70 font-arabic">
                    {state.players.playerB.isConnected ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <motion.div
          className="text-center text-white/60 text-sm max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
            <p className="font-arabic mb-2">💡 تعليمات:</p>
            <div className="text-right space-y-1 font-arabic">
              {myParticipant.type === 'host-pc' && (
                <>
                  <p>• هذا الجهاز للتحكم في اللعبة فقط</p>
                  <p>• اضغط "إنشاء غرفة الفيديو" لبدء الفيديو الموحد</p>
                  <p>
                    • للمشاركة بالفيديو، انضم من هاتفك برمز المقدم{' '}
                    {state.hostCode}
                  </p>
                  <p>• جميع المشاركين سيظهرون في غرفة واحدة</p>
                  <p>• انتظر انضمام اللاعبين ثم اضغط "بدء اللعبة"</p>
                </>
              )}
              {myParticipant.type === 'host-mobile' && (
                <>
                  <p>• أنت متصل كمقدم في غرفة الفيديو الموحدة</p>
                  <p>• يمكنك رؤية جميع المشاركين في نفس الغرفة</p>
                  <p>• الفيديو مدمج في الصفحة، لا حاجة لفتح تطبيق منفصل</p>
                </>
              )}
              {myParticipant.type === 'player' && (
                <>
                  <p>• أنت متصل كلاعب في غرفة الفيديو الموحدة</p>
                  <p>• انتظر إنشاء غرفة الفيديو من المقدم</p>
                  <p>• ستظهر في نفس الغرفة مع المقدم واللاعب الآخر</p>
                  <p>• انتظر بدء اللعبة من المقدم</p>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Session Start Modal */}
      <ConfirmationModal
        isOpen={showSessionStartModal}
        onClose={() => {
          setShowSessionStartModal(false);
          hasShownSessionStartModal.current = false;
        }}
        onConfirm={handleStartSession}
        title="بدء الجلسة"
        message={`انضم ${Object.values(state.players).filter(p => p.isConnected && p.name).length} لاعب للعبة. هل تريد بدء الجلسة الآن؟ سيتم نقل جميع المشاركين إلى غرفة اللعب.`}
        confirmText="بدء الجلسة"
        cancelText="انتظار المزيد"
        isLoading={isStartingSession}
      />
    </div>
  );
}
