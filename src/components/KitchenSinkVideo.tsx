import { useGameActions, useGameState } from '@/hooks/useGameAtoms';
import { shouldUseSimulationMode } from '@/lib/dailyConfig';
import type { LobbyParticipant } from '@/state';
import DailyIframe, { type DailyCall } from '@daily-co/daily-js';
import {
  DailyAudio,
  DailyProvider,
  DailyVideo,
  useDaily,
  useMeetingState,
  useParticipantCounts,
  useParticipantIds,
} from '@daily-co/daily-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface KitchenSinkVideoProps {
  gameId: string;
  myParticipant: LobbyParticipant;
  showAlertMessage: (
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error',
  ) => void;
  className?: string;
}

interface VideoContentProps {
  gameId: string;
  myParticipant: LobbyParticipant;
  showAlertMessage: (
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error',
  ) => void;
}

function VideoContent({
  gameId,
  myParticipant,
  showAlertMessage,
}: VideoContentProps) {
  const daily = useDaily();
  const participantIds = useParticipantIds();
  const meetingState = useMeetingState();
  const { present, hidden } = useParticipantCounts();
  const state = useGameState();
  const { generateDailyToken } = useGameActions();

  const [roomUrl, setRoomUrl] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Use the existing video room URL if available, otherwise allow manual input
  useEffect(() => {
    if (state.videoRoomUrl && !roomUrl) {
      setRoomUrl(state.videoRoomUrl);
    }
  }, [state.videoRoomUrl, roomUrl]);

  const joinCall = useCallback(async () => {
    if (!daily || !roomUrl || isJoining) return;

    setIsJoining(true);
    try {
      console.log('[KitchenSinkVideo] Joining call:', roomUrl);

      // In simulation mode, just simulate joining
      if (shouldUseSimulationMode()) {
        console.log('[KitchenSinkVideo] Simulation mode - simulating join');
        setHasJoined(true);
        showAlertMessage('تم الانضمام للمكالمة (محاكاة تطوير)', 'success');
        return;
      }

      // Generate token for this user
      const token = await generateDailyToken(
        gameId,
        myParticipant.name,
        myParticipant.type === 'controller' || myParticipant.type === 'host',
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
      showAlertMessage('تم الانضمام للمكالمة بنجاح', 'success');
      console.log('[KitchenSinkVideo] Successfully joined the call');
    } catch (error) {
      console.error('[KitchenSinkVideo] Failed to join call:', error);
      showAlertMessage('فشل في الانضمام للمكالمة', 'error');
    } finally {
      setIsJoining(false);
    }
  }, [
    daily,
    roomUrl,
    gameId,
    generateDailyToken,
    myParticipant,
    showAlertMessage,
    isJoining,
  ]);

  const leaveCall = useCallback(async () => {
    if (!daily) return;

    try {
      await daily.leave();
      setHasJoined(false);
      showAlertMessage('تم مغادرة المكالمة', 'info');
    } catch (error) {
      console.error('[KitchenSinkVideo] Failed to leave call:', error);
      showAlertMessage('فشل في مغادرة المكالمة', 'error');
    }
  }, [daily, showAlertMessage]);

  const totalParticipants = present + hidden;

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600/30">
      <h3 className="text-lg font-bold text-white mb-4 text-center font-arabic">
        فيديو المكالمة - نمط Kitchen Sink
      </h3>

      {/* Room URL Input and Join Controls */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-white font-arabic text-sm mb-2">
            رابط الغرفة:
          </label>
          <input
            type="text"
            value={roomUrl}
            onChange={(e) => setRoomUrl(e.target.value)}
            placeholder="https://example.daily.co/room"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-4 justify-center">
          {!hasJoined ? (
            <button
              onClick={joinCall}
              disabled={!roomUrl || isJoining}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-arabic transition-colors"
            >
              {isJoining ? 'جاري الانضمام...' : 'انضمام للمكالمة'}
            </button>
          ) : (
            <button
              onClick={leaveCall}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-arabic transition-colors"
            >
              مغادرة المكالمة
            </button>
          )}
        </div>
      </div>

      {/* Meeting State and Participant Count */}
      <div className="mb-6 text-center space-y-2">
        <div className="text-blue-300 font-arabic">
          حالة الاجتماع: <span className="font-mono">{meetingState}</span>
        </div>
        <div className="text-accent2 font-arabic">
          المشاركون: {totalParticipants} (ظاهر: {present}, مخفي: {hidden})
        </div>
      </div>

      {/* Individual Video Frames - Kitchen Sink Style */}
      <div className="bg-gray-900/50 rounded-lg p-4 min-h-[400px]">
        <h4 className="text-white font-arabic text-center mb-4">
          إطارات الفيديو الفردية
        </h4>

        {shouldUseSimulationMode() && hasJoined ? (
          // Simulation mode
          <div className="text-center">
            <div className="bg-gradient-to-br from-blue-900 to-indigo-800 rounded-lg p-8 inline-block">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 mx-auto animate-pulse">
                {myParticipant.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-white font-arabic font-semibold">
                {myParticipant.name}
              </div>
              <div className="text-blue-200 text-sm font-arabic mt-1">
                محاكاة فيديو - وضع التطوير
              </div>
              <div className="mt-4 flex gap-2 justify-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🎥</span>
                </div>
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🎤</span>
                </div>
              </div>
            </div>
          </div>
        ) : participantIds.length > 0 ? (
          // Production mode with actual Daily video components
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participantIds.map((id) => (
              <div
                key={id}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-600/50"
              >
                <div className="aspect-video relative">
                  <DailyVideo
                    type="video"
                    sessionId={id}
                    automirror
                    className="w-full h-full object-cover"
                  />

                  {/* Participant overlay info */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-arabic">
                    المشارك {id.slice(-4)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasJoined ? (
          <div className="text-center text-gray-400 font-arabic">
            <div className="text-4xl mb-4">👥</div>
            <div>انتظار المشاركين الآخرين...</div>
          </div>
        ) : (
          <div className="text-center text-gray-400 font-arabic">
            <div className="text-4xl mb-4">📹</div>
            <div>انقر على "انضمام للمكالمة" للبدء</div>
          </div>
        )}
      </div>

      {/* Audio Component */}
      {hasJoined && !shouldUseSimulationMode() && <DailyAudio />}

      {/* Info Panel */}
      <div className="mt-4 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
        <p className="text-blue-300 text-sm text-center font-arabic">
          💡 نمط Daily React Kitchen Sink - إطارات فيديو فردية لكل مشارك
        </p>
        <p className="text-blue-200 text-xs text-center mt-1 font-arabic">
          كل مشارك يظهر في مكون DailyVideo منفصل
        </p>
        {shouldUseSimulationMode() && (
          <p className="text-yellow-300 text-xs text-center mt-1 font-arabic">
            🔧 وضع المحاكاة: يتم استخدام محاكاة الفيديو
          </p>
        )}
      </div>
    </div>
  );
}

export default function KitchenSinkVideo({
  gameId,
  myParticipant,
  showAlertMessage,
  className = '',
}: KitchenSinkVideoProps) {
  // Create Daily call object - single instance for the entire component
  const callObject = useMemo<DailyCall | null>(() => {
    try {
      // In simulation mode, we can skip creating the actual call object
      if (shouldUseSimulationMode()) {
        console.log(
          '[KitchenSinkVideo] Skipping Daily call object creation in simulation mode',
        );
        return null;
      }

      return DailyIframe.createCallObject();
    } catch (error) {
      console.warn(
        '[KitchenSinkVideo] Failed to create Daily call object:',
        error,
      );
      return null;
    }
  }, []);

  // Cleanup call object on unmount
  useEffect(() => {
    return () => {
      if (callObject) {
        try {
          const meetingState = callObject.meetingState();
          if (
            meetingState !== 'left-meeting' &&
            meetingState !== 'error' &&
            meetingState !== 'new' &&
            meetingState !== 'loading'
          ) {
            callObject.destroy();
          }
        } catch (error) {
          console.warn('[KitchenSinkVideo] Error during cleanup:', error);
        }
      }
    };
  }, [callObject]);

  return (
    <div className={className}>
      {shouldUseSimulationMode() || callObject ? (
        // In simulation mode, use our VideoContent directly
        // In production, wrap with DailyProvider
        shouldUseSimulationMode() ? (
          <VideoContent
            gameId={gameId}
            myParticipant={myParticipant}
            showAlertMessage={showAlertMessage}
          />
        ) : (
          <DailyProvider callObject={callObject!}>
            <VideoContent
              gameId={gameId}
              myParticipant={myParticipant}
              showAlertMessage={showAlertMessage}
            />
          </DailyProvider>
        )
      ) : (
        <div className="bg-gray-500/20 border border-gray-500/30 rounded-xl p-6">
          <div className="text-center">
            <div className="text-red-400 text-2xl mb-2">⚠️</div>
            <div className="text-gray-400 text-lg font-bold mb-2 font-arabic">
              فشل في تهيئة مكونات الفيديو
            </div>
            <div className="text-gray-300 text-sm font-arabic">
              تحقق من اتصال الإنترنت أو أعد تحميل الصفحة
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
