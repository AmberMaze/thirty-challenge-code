import { useGameActions } from '@/hooks/useGameAtoms';
import { useTranslation } from '@/hooks/useTranslation';
import { shouldUseSimulationMode } from '@/lib/dailyConfig';
import type { LobbyParticipant } from '@/state';
import DailyIframe, { type DailyCall } from '@daily-co/daily-js';
import {
  DailyProvider,
  useDaily,
  useParticipantIds,
} from '@daily-co/daily-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface VideoGridProps {
  gameId: string;
  myParticipant: LobbyParticipant;
  showAlertMessage: (
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error',
  ) => void;
  className?: string;
}

interface VideoRoomFrameProps {
  roomType: 'host' | 'playerA' | 'playerB';
  gameId: string;
  myParticipant: LobbyParticipant;
  roomUrl?: string;
  isRoomCreated: boolean;
  onCreateRoom: () => void;
  onDeleteRoom: () => void;
  onJoinRoom: () => void;
  showAlertMessage: (
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error',
  ) => void;
}

interface VideoRoomContentProps {
  roomType: 'host' | 'playerA' | 'playerB';
  gameId: string;
  myParticipant: LobbyParticipant;
  roomUrl: string;
  showAlertMessage: (
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error',
  ) => void;
}

function VideoRoomContent({
  roomType,
  gameId,
  myParticipant,
  roomUrl,
  showAlertMessage,
}: VideoRoomContentProps) {
  const daily = useDaily();
  const participantIds = useParticipantIds();
  const { generateDailyToken } = useGameActions();
  const { language } = useTranslation();
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [devModeSimulation, setDevModeSimulation] = useState(false);

  // Determine if this is my room
  const isMyRoom = useMemo(() => {
    if (roomType === 'host') {
      return (
        myParticipant.type === 'controller' || myParticipant.type === 'host'
      );
    }
    return myParticipant.id === roomType;
  }, [roomType, myParticipant]);

  // Simulation mode for video
  useEffect(() => {
    if (!shouldUseSimulationMode()) return;

    if (isMyRoom && !hasJoined && !isJoining) {
      const timer = setTimeout(() => {
        setDevModeSimulation(true);
        setHasJoined(true);
        showAlertMessage(
          `تم تفعيل محاكاة الفيديو لغرفة ${getRoomLabel(roomType)} في وضع التطوير`,
          'success',
        );
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isMyRoom, hasJoined, isJoining, roomType, showAlertMessage]);

  // Join room when URL is available and it's my room (skip in simulation mode)
  useEffect(() => {
    if (
      !daily ||
      !roomUrl ||
      !isMyRoom ||
      hasJoined ||
      isJoining ||
      shouldUseSimulationMode()
    )
      return;

    const joinRoom = async () => {
      setIsJoining(true);
      try {
        console.log(`[VideoGrid] Joining ${roomType} room:`, roomUrl);

        // Generate token for this user
        const token = await generateDailyToken(
          `${gameId}-${roomType}`,
          myParticipant.name,
          roomType === 'host',
          false, // Not observer mode
        );

        if (!token) {
          throw new Error('Failed to get access token');
        }

        // Join the Daily call
        await daily.join({
          url: roomUrl,
          token: token,
          userName: myParticipant.name,
        });

        // Enable camera and microphone
        await daily.setLocalVideo(true);
        await daily.setLocalAudio(true);

        setHasJoined(true);
        showAlertMessage(
          `تم الانضمام بنجاح لغرفة ${getRoomLabel(roomType)}`,
          'success',
        );
        console.log(`[VideoGrid] Successfully joined ${roomType} room`);
      } catch (error) {
        console.error(`[VideoGrid] Failed to join ${roomType} room:`, error);
        setJoinError(`فشل في الانضمام لغرفة ${getRoomLabel(roomType)}`);
        showAlertMessage(
          `فشل في الانضمام لغرفة ${getRoomLabel(roomType)}`,
          'error',
        );
      } finally {
        setIsJoining(false);
      }
    };

    joinRoom();
  }, [
    daily,
    roomUrl,
    gameId,
    generateDailyToken,
    myParticipant,
    roomType,
    isMyRoom,
    hasJoined,
    isJoining,
    showAlertMessage,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (daily && hasJoined && !shouldUseSimulationMode()) {
        daily.leave().catch(console.error);
      }
    };
  }, [daily, hasJoined]);

  const getRoomLabel = (type: string) => {
    switch (type) {
      case 'host':
        return language === 'ar' ? 'المقدم' : 'Host';
      case 'playerA':
        return language === 'ar' ? 'اللاعب الأول' : 'Player A';
      case 'playerB':
        return language === 'ar' ? 'اللاعب الثاني' : 'Player B';
      case 'controller':
        return language === 'ar' ? 'تحكم' : 'Controller';
      default:
        return type;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Room header */}
      <div className="p-3 bg-gray-800/80 border-b border-gray-600/50">
        <h4 className="text-white font-arabic text-center font-semibold">
          {getRoomLabel(roomType)}
        </h4>
        <div className="text-xs text-gray-400 text-center font-arabic mt-1">
          {isMyRoom ? 'غرفتي' : 'غرفة أخرى'}
          {hasJoined && ' • متصل'}
          {isJoining && ' • جاري الاتصال...'}
          {devModeSimulation && ' • محاكاة تطوير'}
        </div>
      </div>

      {/* Video content */}
      <div className="flex-1 bg-gray-900 relative">
        {isJoining ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <div className="text-gray-400 text-sm font-arabic">
                جاري الاتصال...
              </div>
            </div>
          </div>
        ) : joinError ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-400 text-lg mb-2">⚠️</div>
              <div className="text-red-400 text-sm font-arabic">
                {joinError}
              </div>
              <button
                onClick={() => {
                  setJoinError(null);
                  setHasJoined(false);
                }}
                className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-arabic"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        ) : devModeSimulation ? (
          // Development mode: Show simulated video
          <div className="h-full relative bg-gradient-to-br from-blue-900 to-indigo-800">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto animate-pulse">
                  {myParticipant.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-white font-arabic font-semibold">
                  {myParticipant.name}
                </div>
                <div className="text-blue-200 text-sm font-arabic mt-1">
                  محاكاة فيديو - وضع التطوير
                </div>
              </div>
            </div>

            {/* Simulated video controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🎥</span>
              </div>
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🎤</span>
              </div>
            </div>

            {/* Mock participant indicator */}
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-arabic">
              1 مشارك (محاكاة)
            </div>
          </div>
        ) : participantIds.length > 0 ? (
          <div className="h-full relative">
            {/* Daily.co video elements will be injected here automatically */}
            <div className="absolute inset-0 [&>div]:h-full [&>div>div]:h-full">
              {/* Daily's video elements will be injected here */}
            </div>

            {/* Participant count overlay */}
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-arabic">
              {participantIds.length} مشارك
            </div>
          </div>
        ) : hasJoined ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2">
                {myParticipant.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-gray-400 text-sm font-arabic">
                انتظار المشاركين الآخرين
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-2">📹</div>
              <div className="text-gray-400 text-sm font-arabic">غير متصل</div>
            </div>
          </div>
        )}
      </div>

      {/* Connection status */}
      <div className="p-2 bg-gray-800/60 border-t border-gray-600/50">
        <div className="flex items-center justify-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              hasJoined
                ? 'bg-green-400'
                : joinError
                  ? 'bg-red-400'
                  : 'bg-yellow-400'
            }`}
          ></div>
          <span className="text-xs text-gray-400 font-arabic">
            {hasJoined
              ? devModeSimulation
                ? 'محاكاة نشطة'
                : 'متصل'
              : joinError
                ? 'خطأ'
                : 'غير متصل'}
          </span>
        </div>
      </div>
    </div>
  );
}

function VideoRoomFrame({
  roomType,
  gameId,
  myParticipant,
  roomUrl,
  isRoomCreated,
  onCreateRoom,
  onDeleteRoom,
  onJoinRoom,
  showAlertMessage,
}: VideoRoomFrameProps) {
  // Use a single shared call object instance managed at the top level
  const callObjectRef = useRef<DailyCall | null>(null);
  const { language } = useTranslation();

  // Create Daily call object for this room only when needed and no duplicates exist
  const callObject = useMemo<DailyCall | null>(() => {
    try {
      // In development mode, check if we should use simulation or real integration
      if (shouldUseSimulationMode()) {
        // For simulation, we'll use a mock or simplified approach
        console.log(
          `[VideoGrid] Skipping Daily call object creation in simulation mode for ${roomType}`,
        );
        return null;
      }

      // In production or development with real integration, create call object if needed
      if (!callObjectRef.current && isRoomCreated && roomUrl) {
        callObjectRef.current = DailyIframe.createCallObject();
        console.log(`[VideoGrid] Created Daily call object for ${roomType}`);
      }

      return callObjectRef.current;
    } catch (error) {
      console.warn(
        `[VideoGrid] Failed to create Daily call object for ${roomType}:`,
        error,
      );
      return null;
    }
  }, [roomType, isRoomCreated, roomUrl]);

  // Cleanup call object on unmount or when room is deleted
  useEffect(() => {
    return () => {
      if (callObjectRef.current) {
        try {
          const meetingState = callObjectRef.current.meetingState();
          if (
            meetingState !== 'left-meeting' &&
            meetingState !== 'error' &&
            meetingState !== 'new' &&
            meetingState !== 'loading'
          ) {
            callObjectRef.current.destroy();
          }
        } catch (error) {
          console.warn(`[VideoGrid] Error during ${roomType} cleanup:`, error);
        }
        callObjectRef.current = null;
      }
    };
  }, [roomType]);

  // Clean up when room is deleted
  useEffect(() => {
    if (!isRoomCreated && callObjectRef.current) {
      try {
        callObjectRef.current.destroy();
        callObjectRef.current = null;
        console.log(
          `[VideoGrid] Cleaned up call object for deleted ${roomType} room`,
        );
      } catch (error) {
        console.warn(
          `[VideoGrid] Error cleaning up ${roomType} call object:`,
          error,
        );
      }
    }
  }, [isRoomCreated, roomType]);

  const getRoomLabel = (type: string) => {
    switch (type) {
      case 'host':
        return language === 'ar' ? 'المقدم' : 'Host';
      case 'playerA':
        return language === 'ar' ? 'اللاعب الأول' : 'Player A';
      case 'playerB':
        return language === 'ar' ? 'اللاعب الثاني' : 'Player B';
      case 'controller':
        return language === 'ar' ? 'تحكم' : 'Controller';
      default:
        return type;
    }
  };

  return (
    <div className="flex-1 bg-gray-800 overflow-hidden border-b border-gray-600/50 md:border md:border-gray-600/50 md:rounded-lg flex flex-col min-h-[350px] md:min-h-[300px]">
      {/* Room controls */}
      <div className="p-3 bg-gray-700/50 border-b border-gray-600/50">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-arabic font-semibold">
            {getRoomLabel(roomType)}
          </h4>
          <div className="flex gap-2">
            {!isRoomCreated ? (
              <button
                onClick={onCreateRoom}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-arabic transition-colors"
              >
                إنشاء غرفة
              </button>
            ) : (
              <>
                <button
                  onClick={onJoinRoom}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-arabic transition-colors"
                >
                  {shouldUseSimulationMode() ? 'تفعيل محاكاة' : 'تفعيل مدمج'}
                </button>
                <button
                  onClick={onDeleteRoom}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-arabic transition-colors"
                >
                  حذف
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Video content */}
      <div className="flex-1">
        {isRoomCreated && roomUrl ? (
          shouldUseSimulationMode() ? (
            // Development mode: Use our enhanced VideoRoomContent without DailyProvider
            <VideoRoomContent
              roomType={roomType}
              gameId={gameId}
              myParticipant={myParticipant}
              roomUrl={roomUrl}
              showAlertMessage={showAlertMessage}
            />
          ) : callObject ? (
            // Production mode: Use DailyProvider only when we have a valid call object
            <DailyProvider callObject={callObject}>
              <VideoRoomContent
                roomType={roomType}
                gameId={gameId}
                myParticipant={myParticipant}
                roomUrl={roomUrl}
                showAlertMessage={showAlertMessage}
              />
            </DailyProvider>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-yellow-500 text-2xl mb-2">⚠️</div>
                <div className="text-gray-400 text-sm font-arabic">
                  فشل في تهيئة مكونات الفيديو
                </div>
                <div className="text-gray-500 text-xs font-arabic mt-1">
                  تحقق من اتصال الإنترنت أو أعد تحميل الصفحة
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 text-2xl mb-2">🏠</div>
              <div className="text-gray-400 text-sm font-arabic">
                {isRoomCreated ? 'جاري التحميل...' : 'لم يتم إنشاء الغرفة'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VideoGrid({
  gameId,
  myParticipant,
  showAlertMessage,
  className = '',
}: VideoGridProps) {
  const { createVideoRoom, endVideoRoom } = useGameActions();

  // Room states
  const [rooms, setRooms] = useState({
    host: { url: '', created: false, loading: false },
    playerA: { url: '', created: false, loading: false },
    playerB: { url: '', created: false, loading: false },
  });

  // Create room function
  const handleCreateRoom = useCallback(
    async (roomType: 'host' | 'playerA' | 'playerB') => {
      setRooms((prev) => ({
        ...prev,
        [roomType]: { ...prev[roomType], loading: true },
      }));

      try {
        const roomName = `${gameId}-${roomType}`;
        const result = await createVideoRoom(roomName);

        if (result.success && result.roomUrl) {
          setRooms((prev) => ({
            ...prev,
            [roomType]: { url: result.roomUrl!, created: true, loading: false },
          }));
          showAlertMessage(`تم إنشاء غرفة ${roomType} بنجاح`, 'success');
        } else {
          throw new Error(result.error || 'فشل في إنشاء الغرفة');
        }
      } catch (error) {
        console.error(`Error creating ${roomType} room:`, error);
        showAlertMessage(`فشل في إنشاء غرفة ${roomType}`, 'error');
        setRooms((prev) => ({
          ...prev,
          [roomType]: { ...prev[roomType], loading: false },
        }));
      }
    },
    [gameId, createVideoRoom, showAlertMessage],
  );

  // Delete room function
  const handleDeleteRoom = useCallback(
    async (roomType: 'host' | 'playerA' | 'playerB') => {
      setRooms((prev) => ({
        ...prev,
        [roomType]: { ...prev[roomType], loading: true },
      }));

      try {
        const roomName = `${gameId}-${roomType}`;
        await endVideoRoom(roomName);

        setRooms((prev) => ({
          ...prev,
          [roomType]: { url: '', created: false, loading: false },
        }));
        showAlertMessage(`تم حذف غرفة ${roomType}`, 'success');
      } catch (error) {
        console.error(`Error deleting ${roomType} room:`, error);
        showAlertMessage(`فشل في حذف غرفة ${roomType}`, 'error');
        setRooms((prev) => ({
          ...prev,
          [roomType]: { ...prev[roomType], loading: false },
        }));
      }
    },
    [gameId, endVideoRoom, showAlertMessage],
  );

  // Join room function - now activates embedded video instead of opening new tab
  const handleJoinRoom = useCallback(
    (roomType: 'host' | 'playerA' | 'playerB') => {
      const room = rooms[roomType];
      if (room.url) {
        // Instead of opening in new tab, show message that video is embedded
        if (shouldUseSimulationMode()) {
          showAlertMessage(
            `تم تفعيل محاكاة الفيديو لغرفة ${roomType} في وضع التطوير`,
            'success',
          );
        } else {
          showAlertMessage(
            `تم تفعيل غرفة ${roomType} المدمجة في الصفحة`,
            'success',
          );
        }
      }
    },
    [rooms, showAlertMessage],
  );

  // Delete all rooms
  const handleDeleteAllRooms = useCallback(async () => {
    const roomTypes: ('host' | 'playerA' | 'playerB')[] = [
      'host',
      'playerA',
      'playerB',
    ];

    for (const roomType of roomTypes) {
      if (rooms[roomType].created) {
        await handleDeleteRoom(roomType);
      }
    }

    showAlertMessage('تم حذف جميع الغرف', 'success');
  }, [rooms, handleDeleteRoom, showAlertMessage]);

  return (
    <div className={`${className}`}>
      {/* Global controls */}
      <div className="mb-4 bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
        <h3 className="text-lg font-bold text-white mb-4 text-center font-arabic">
          تحكم الغرف العام
        </h3>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleCreateRoom('host')}
            disabled={rooms.host.created || rooms.host.loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-arabic transition-colors"
          >
            {rooms.host.loading ? 'جاري الإنشاء...' : 'إنشاء غرفة المقدم'}
          </button>
          <button
            onClick={() => handleCreateRoom('playerA')}
            disabled={rooms.playerA.created || rooms.playerA.loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-arabic transition-colors"
          >
            {rooms.playerA.loading
              ? 'جاري الإنشاء...'
              : 'إنشاء غرفة اللاعب الأول'}
          </button>
          <button
            onClick={() => handleCreateRoom('playerB')}
            disabled={rooms.playerB.created || rooms.playerB.loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-arabic transition-colors"
          >
            {rooms.playerB.loading
              ? 'جاري الإنشاء...'
              : 'إنشاء غرفة اللاعب الثاني'}
          </button>
          <button
            onClick={handleDeleteAllRooms}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-arabic transition-colors"
          >
            حذف جميع الغرف
          </button>
        </div>
      </div>

      {/* Video grid - 1x3 horizontal layout */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
        <h3 className="text-lg font-bold text-white mb-4 text-center font-arabic">
          شبكة الفيديو - ثلاث غرف منفصلة
        </h3>

        <div className="flex flex-col lg:flex-row lg:gap-1 min-h-[400px] lg:min-h-[500px]">
          {/* Host room */}
          <VideoRoomFrame
            roomType="host"
            gameId={gameId}
            myParticipant={myParticipant}
            roomUrl={rooms.host.url}
            isRoomCreated={rooms.host.created}
            onCreateRoom={() => handleCreateRoom('host')}
            onDeleteRoom={() => handleDeleteRoom('host')}
            onJoinRoom={() => handleJoinRoom('host')}
            showAlertMessage={showAlertMessage}
          />

          {/* Vertical divider for large screens only */}
          <div className="hidden lg:block w-px bg-gray-600" />

          {/* Player A room */}
          <VideoRoomFrame
            roomType="playerA"
            gameId={gameId}
            myParticipant={myParticipant}
            roomUrl={rooms.playerA.url}
            isRoomCreated={rooms.playerA.created}
            onCreateRoom={() => handleCreateRoom('playerA')}
            onDeleteRoom={() => handleDeleteRoom('playerA')}
            onJoinRoom={() => handleJoinRoom('playerA')}
            showAlertMessage={showAlertMessage}
          />

          {/* Vertical divider for large screens only */}
          <div className="hidden lg:block w-px bg-gray-600" />

          {/* Player B room */}
          <VideoRoomFrame
            roomType="playerB"
            gameId={gameId}
            myParticipant={myParticipant}
            roomUrl={rooms.playerB.url}
            isRoomCreated={rooms.playerB.created}
            onCreateRoom={() => handleCreateRoom('playerB')}
            onDeleteRoom={() => handleDeleteRoom('playerB')}
            onJoinRoom={() => handleJoinRoom('playerB')}
            showAlertMessage={showAlertMessage}
          />
        </div>

        {/* Info note */}
        <div className="mt-4 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <p className="text-blue-300 text-sm text-center font-arabic">
            💡 كل إطار هو غرفة Daily.co منفصلة مع تحكم مستقل
          </p>
          <p className="text-blue-200 text-xs text-center mt-1 font-arabic">
            الغرف المنشأة:{' '}
            {Object.values(rooms).filter((r) => r.created).length}/3
          </p>
          {shouldUseSimulationMode() && (
            <p className="text-yellow-300 text-xs text-center mt-1 font-arabic">
              🔧 وضع المحاكاة: يتم استخدام محاكاة الفيديو بدلاً من Daily.co
              الفعلي
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
