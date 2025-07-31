/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { useGame } from '@/hooks/useGame';

interface VideoRoomProps {
  gameId: string;
  userName: string;
  userRole: 'host-mobile' | 'playerA' | 'playerB';
  className?: string;
}

export default function VideoRoom({
  gameId,
  userName,
  userRole,
  className = '',
}: VideoRoomProps) {
  const { state, generateDailyToken } = useGame();
  const callFrameRef = useRef<HTMLDivElement>(null);
  const callObjectRef = useRef<unknown>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [callState, setCallState] = useState<string>('new');
  const [error, setError] = useState<string>('');

  const joinCall = useCallback(async () => {
    if (!callFrameRef.current) return;

    setIsJoining(true);
    setError('');

    try {
      // Get Daily.co token for this user
      const token = await generateDailyToken(
        gameId,
        userName,
        userRole === 'host-mobile',
      );
      if (!token) {
        throw new Error('Failed to get access token');
      }

      // Create Daily call object
      const callObject = DailyIframe.createCallObject({
        iframeStyle: {
          position: 'relative',
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '12px',
        },
      });

      callObjectRef.current = callObject;

      // Add event listeners
      (callObject as any)
        .on('joined-meeting', () => {
          console.log('Joined meeting successfully');
          setCallState('joined');
          setIsJoining(false);
        })
        .on('left-meeting', () => {
          console.log('Left meeting');
          setCallState('left');
        })
        .on('error', (error: unknown) => {
          console.error('Daily.co error:', error);
          const errorMsg =
            (error as { errorMsg?: string })?.errorMsg || 'Video call error';
          setError(errorMsg);
          setIsJoining(false);
        })
        .on('participant-joined', (event: unknown) => {
          console.log(
            'Participant joined:',
            (event as { participant?: unknown })?.participant,
          );
        })
        .on('participant-left', (event: unknown) => {
          console.log(
            'Participant left:',
            (event as { participant?: unknown })?.participant,
          );
        });

      // Join the meeting
      await (callObject as any).join({
        url: state.videoRoomUrl,
        token,
        userName,
        startVideoOff: false,
        startAudioOff: false,
      });

      // Append to DOM
      callFrameRef.current.appendChild((callObject as any).iframe());
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to join video call';
      console.error('Failed to join call:', error);
      setError(errorMessage);
      setIsJoining(false);
    }
  }, [generateDailyToken, gameId, userName, userRole, state.videoRoomUrl]);

  // Join the video call when room is available
  useEffect(() => {
    if (
      !state.videoRoomCreated ||
      !state.videoRoomUrl ||
      callObjectRef.current
    ) {
      return;
    }

    joinCall();
  }, [state.videoRoomCreated, state.videoRoomUrl, joinCall]);

  // Leave the call if the room is ended remotely
  useEffect(() => {
    if (!state.videoRoomCreated && callObjectRef.current) {
      leaveCall();
    }
  }, [state.videoRoomCreated]);

  const leaveCall = async () => {
    if (callObjectRef.current) {
      try {
        await (callObjectRef.current as any).leave();
        await (callObjectRef.current as any).destroy();
        callObjectRef.current = null;
        setCallState('left');
      } catch (error) {
        console.error('Error leaving call:', error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveCall();
    };
  }, []);

  if (error) {
    return (
      <div
        className={`bg-red-500/20 border border-red-500/30 rounded-xl p-6 ${className}`}
      >
        <div className="text-center">
          <div className="text-red-400 text-lg font-bold mb-2 font-arabic">
            خطأ في الفيديو
          </div>
          <div className="text-red-300 text-sm mb-4 font-arabic">{error}</div>
          <button
            onClick={joinCall}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-arabic transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!state.videoRoomCreated) {
    return (
      <div
        className={`bg-gray-500/20 border border-gray-500/30 rounded-xl p-6 ${className}`}
      >
        <div className="text-center">
          <div className="text-gray-400 text-lg font-bold mb-2 font-arabic">
            غرفة الفيديو غير متاحة
          </div>
          <div className="text-gray-300 text-sm font-arabic">
            في انتظار إنشاء غرفة الفيديو...
          </div>
        </div>
      </div>
    );
  }

  if (isJoining) {
    return (
      <div
        className={`bg-blue-500/20 border border-blue-500/30 rounded-xl p-6 ${className}`}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-blue-400 text-lg font-bold mb-2 font-arabic">
            الانضمام للفيديو
          </div>
          <div className="text-blue-300 text-sm font-arabic">
            جاري الاتصال...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={callFrameRef}
        className="w-full h-full min-h-[300px] bg-gray-800 rounded-xl overflow-hidden"
        style={{ aspectRatio: '16/9' }}
      />

      {callState === 'joined' && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-arabic">
          متصل
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-arabic">
        {userName}
      </div>
    </div>
  );
}
