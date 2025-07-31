import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameState, useGameActions, useLobbyActions, useGameSync } from '@/hooks/useGameAtoms';
import VideoRoom from '@/components/VideoRoom';
import AlertBanner from '@/components/AlertBanner';
import ConfirmationModal from '@/components/ConfirmationModal';
import type { LobbyParticipant } from '@/state';

export default function TrueLobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = useGameState();
  const { startGame, createVideoRoom, endVideoRoom } = useGameActions();
  const { myParticipant, setParticipant } = useLobbyActions();
  
  // Initialize game sync
  useGameSync();

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [showAlert, setShowAlert] = useState(false);
  const [showSessionStartModal, setShowSessionStartModal] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Function to show alerts
  const showAlertMessage = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  }, []);

  // Automatically create the video room when the host PC opens the lobby
  useEffect(() => {
    if (
      myParticipant?.type === 'host-pc' &&
      !state.videoRoomCreated &&
      gameId
    ) {
      setIsCreatingRoom(true);
      createVideoRoom(gameId).finally(() =>
        setIsCreatingRoom(false),
      );
    }
  }, [myParticipant, state.videoRoomCreated, gameId, createVideoRoom]);

  // Automatically create video room when first player joins if host hasn't created it yet
  useEffect(() => {
    if (
      myParticipant?.type === 'player' &&
      !state.videoRoomCreated &&
      gameId &&
      !isCreatingRoom
    ) {
      console.log('Player joining without video room - creating room automatically');
      setIsCreatingRoom(true);
      createVideoRoom(gameId)
        .then((result) => {
          if (result.success) {
            showAlertMessage('تم إنشاء غرفة الفيديو تلقائياً', 'success');
          } else {
            showAlertMessage('فشل في إنشاء غرفة الفيديو', 'error');
          }
        })
        .finally(() => setIsCreatingRoom(false));
    }
  }, [myParticipant, state.videoRoomCreated, gameId, createVideoRoom, isCreatingRoom, showAlertMessage]);

  // Use global video room state
  const videoRoomCreated = state.videoRoomCreated || false;

  // Initialize game and determine my role
  useEffect(() => {
    if (!gameId) return;

    // Initialize game if needed
    if (state.gameId !== gameId) {
      // For now, just update the atoms - we'll handle game loading separately
      startGame();
    }

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
    } else if (role === 'host-mobile') {
      // Mobile Host (with video)
      participant = {
        id: 'host-mobile',
        name: name || state.hostName || 'المقدم',
        type: 'host-mobile',
        isConnected: true,
      };
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
  }, [gameId, searchParams, state.gameId, state.hostName, startGame, setParticipant]);

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
        state.phase === 'CONFIG' &&
        !hasShownSessionStartModal.current
      ) {
        setShowSessionStartModal(true);
        hasShownSessionStartModal.current = true;
      }

      // Update the previous state
      previousConnectedPlayerIds.current = currentConnectedPlayerIds;
    }
  }, [state.players, state.videoRoomCreated, state.phase, myParticipant]);

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

        {/* Unified Video Grid - Same for everyone */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Host Mobile Video */}
          <div className="bg-gradient-to-br from-blue-800/30 to-purple-800/30 rounded-xl p-6 border border-blue-500/30">
            <h3 className="text-xl font-bold text-blue-300 mb-4 font-arabic text-center">
              المقدم {myParticipant.type === 'host-mobile' && '(أنت)'}
            </h3>

            <div className="aspect-video bg-black/30 rounded-lg mb-4 overflow-hidden">
              {videoRoomCreated && myParticipant.type === 'host-mobile' ? (
                <VideoRoom
                  gameId={gameId}
                  userName={state.hostName ?? ''}
                  userRole="host-mobile"
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white/50">
                    <div className="text-4xl mb-2">📱</div>
                    <p className="text-sm font-arabic">
                      {!videoRoomCreated
                        ? myParticipant.type === 'host-pc'
                          ? 'اضغط "إنشاء غرفة الفيديو" أولاً'
                          : 'في انتظار إنشاء الغرفة...'
                        : myParticipant.type === 'host-pc'
                          ? 'انضم من هاتفك للفيديو'
                          : 'في انتظار المقدم...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-white font-arabic text-lg">{state.hostName}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    hostMobileConnected ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
                <span className="text-white/70 text-sm font-arabic">
                  {hostMobileConnected ? 'متصل' : 'غير متصل'}
                </span>
              </div>
            </div>
          </div>

          {/* Player A and B Videos */}
          {(['playerA', 'playerB'] as const).map((playerId, index) => {
            const player = state.players[playerId];
            const isMe =
              myParticipant.type === 'player' &&
              myParticipant.playerId === playerId;

            return (
              <div
                key={playerId}
                className={`bg-gradient-to-br rounded-xl p-6 border ${
                  isMe
                    ? 'from-green-800/40 to-blue-800/40 border-green-500/50'
                    : 'from-gray-800/30 to-gray-700/30 border-gray-500/30'
                }`}
              >
                <h3 className="text-xl font-bold text-center mb-4 text-accent2 font-arabic">
                  لاعب {index + 1} {isMe && '(أنت)'}
                </h3>

                <div className="aspect-video bg-black/30 rounded-lg mb-4 overflow-hidden">
                  {videoRoomCreated && isMe ? (
                    <VideoRoom
                      gameId={gameId}
                      userName={player.name || name || 'لاعب'}
                      userRole={playerId}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white/50">
                        <div className="text-4xl mb-2">👤</div>
                        <p className="text-sm font-arabic">
                          {!videoRoomCreated
                            ? 'في انتظار إنشاء الغرفة...'
                            : !isMe
                              ? (player.isConnected 
                                  ? 'فيديو اللاعب الآخر' 
                                  : 'في انتظار الاتصال...')
                              : 'جاري تحضير الفيديو...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {player.isConnected ? (
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`fi fi-${player.flag} w-6 h-4 rounded`}
                      ></span>
                      <p className="text-white font-arabic text-lg">
                        {player.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <img
                        src={`/src/assets/logos/${player.club}.svg`}
                        alt={player.club}
                        className="w-6 h-6"
                        loading="lazy"
                      />
                      <p className="text-white/70 text-sm font-arabic capitalize">
                        {player.club?.replace('-', ' ')}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-green-400 text-sm font-arabic">
                        متصل
                      </span>
                    </div>

                    <div className="text-white/60 text-sm font-arabic">
                      النقاط: {player.score} | الأخطاء: {player.strikes ?? 0}/3
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-white/50 font-arabic">لم ينضم بعد</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      <span className="text-gray-400 text-sm font-arabic">
                        غير متصل
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                  <p>• اضغط "إنشاء غرفة الفيديو" لبدء الفيديو</p>
                  <p>
                    • للمشاركة بالفيديو، انضم من هاتفك برمز المقدم{' '}
                    {state.hostCode}
                  </p>
                  <p>• انتظر انضمام اللاعبين ثم اضغط "بدء اللعبة"</p>
                </>
              )}
              {myParticipant.type === 'host-mobile' && (
                <>
                  <p>• أنت متصل كمقدم بالفيديو</p>
                  <p>• يمكنك رؤية جميع المشاركين في نفس الصفحة</p>
                </>
              )}
              {myParticipant.type === 'player' && (
                <>
                  <p>• أنت متصل كلاعب</p>
                  <p>• انتظر إنشاء غرفة الفيديو من المقدم</p>
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
