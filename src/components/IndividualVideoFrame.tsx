import { useEffect, useRef, useState, useCallback } from 'react';

interface IndividualVideoFrameProps {
  gameId: string;
  participantType: 'host' | 'playerA' | 'playerB';
  participantName: string;
  isConnected: boolean;
  className?: string;
  observerMode?: boolean;
}

export default function IndividualVideoFrame({
  participantType,
  participantName: initialParticipantName,
  isConnected: initialIsConnected,
  className = '',
}: IndividualVideoFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callObjectRef = useRef<any>(null);
  
  // Local state for this frame
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasFakeParticipant, setHasFakeParticipant] = useState(false);
  const [participantName, setParticipantName] = useState(initialParticipantName);
  const [isConnected, setIsConnected] = useState(initialIsConnected);
  const [isCallObjectReady, setIsCallObjectReady] = useState(false);

  // Add fake participant to this frame
  const addFakeParticipant = useCallback(async () => {
    if (!callObjectRef.current || hasFakeParticipant) return;

    try {
      setIsLoading(true);
      console.log(`[IndividualVideoFrame-${participantType}] Adding fake participant...`);

      // Add fake participant with aspect ratio
      callObjectRef.current.addFakeParticipant({ 
        aspectRatio: 16/9 // Standard video aspect ratio
      });

      setHasFakeParticipant(true);
      setIsConnected(true);
      console.log(`[IndividualVideoFrame-${participantType}] Fake participant added successfully`);

    } catch (error) {
      console.error(`[IndividualVideoFrame-${participantType}] Failed to add fake participant:`, error);
      setError('Failed to add fake participant');
    } finally {
      setIsLoading(false);
    }
  }, [participantType, hasFakeParticipant]);

  // Remove fake participant (leave call)
  const removeFakeParticipant = useCallback(async () => {
    if (!callObjectRef.current || !hasFakeParticipant) return;

    try {
      console.log(`[IndividualVideoFrame-${participantType}] Removing fake participant...`);
      
      // Leave the call to remove fake participant
      await callObjectRef.current.leave();
      setHasFakeParticipant(false);
      setIsConnected(false);
      
      console.log(`[IndividualVideoFrame-${participantType}] Fake participant removed`);

    } catch (error) {
      console.error(`[IndividualVideoFrame-${participantType}] Failed to remove fake participant:`, error);
      setError('Failed to remove fake participant');
    }
  }, [participantType, hasFakeParticipant]);

  // Setup call object when component mounts
  useEffect(() => {
    const setup = async () => {
      if (callObjectRef.current || !containerRef.current) return;

      try {
        setIsLoading(true);
        setError('');

        console.log(`[IndividualVideoFrame-${participantType}] Setting up call object...`);

        // Try to import Daily.co dynamically
        let DailyIframe;
        try {
          const DailyModule = await import('@daily-co/daily-js');
          DailyIframe = DailyModule.default;
        } catch (importError) {
          console.warn(`[IndividualVideoFrame-${participantType}] Daily.co not available, using fallback`);
          // Fallback: just show controls without actual video
          setIsCallObjectReady(true);
          setIsLoading(false);
          return;
        }

        // Create a new Daily call object for this frame
        const callObject = DailyIframe.createCallObject({
          iframeStyle: {
            position: 'relative',
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '8px'
          },
          showLeaveButton: false,
          showFullscreenButton: false,
          showLocalVideo: true,
          showParticipantsBar: false,
          activeSpeakerMode: false
        });

        callObjectRef.current = callObject;

        // Append iframe to container
        const iframe = callObject.iframe();
        if (iframe && containerRef.current) {
          containerRef.current.appendChild(iframe);
          console.log(`[IndividualVideoFrame-${participantType}] Call object ready`);
        }

        setIsCallObjectReady(true);

      } catch (error) {
        console.error(`[IndividualVideoFrame-${participantType}] Failed to setup call object:`, error);
        setError('Failed to setup video frame');
        // Still show controls even if video setup fails
        setIsCallObjectReady(true);
      } finally {
        setIsLoading(false);
      }
    };

    setup();

    // Cleanup on unmount
    return () => {
      if (callObjectRef.current) {
        try {
          callObjectRef.current.destroy();
        } catch (error) {
          console.warn(`[IndividualVideoFrame-${participantType}] Error during cleanup:`, error);
        }
        callObjectRef.current = null;
      }
    };
  }, [participantType]);

  // Get the appropriate color scheme for this participant type
  const getColorScheme = () => {
    switch (participantType) {
      case 'host':
        return {
          border: 'border-blue-500/30',
          bg: 'bg-blue-500/20',
          text: 'text-blue-300',
          accent: 'bg-blue-600'
        };
      case 'playerA':
        return {
          border: 'border-green-500/30',
          bg: 'bg-green-500/20',
          text: 'text-green-300',
          accent: 'bg-green-600'
        };
      case 'playerB':
        return {
          border: 'border-purple-500/30',
          bg: 'bg-purple-500/20',
          text: 'text-purple-300',
          accent: 'bg-purple-600'
        };
      default:
        return {
          border: 'border-gray-500/30',
          bg: 'bg-gray-500/20',
          text: 'text-gray-300',
          accent: 'bg-gray-600'
        };
    }
  };

  const colors = getColorScheme();

  if (error) {
    return (
      <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 ${className}`}>
        <div className="text-center">
          <div className={`${colors.text} text-lg font-bold mb-2 font-arabic`}>
            خطأ في الفيديو
          </div>
          <div className={`${colors.text} text-sm mb-4 font-arabic`}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            className={`px-4 py-2 ${colors.accent} hover:opacity-80 text-white rounded-lg font-arabic transition-colors`}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !isCallObjectReady) {
    return (
      <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className={`${colors.text} text-lg font-bold mb-2 font-arabic`}>
            {participantName}
          </div>
          <div className="text-gray-400 text-sm font-arabic">
            جاري تحضير إطار الفيديو...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header with participant info and controls */}
      <div className={`${colors.bg} border ${colors.border} rounded-t-xl p-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className={`${colors.text} font-bold font-arabic bg-transparent border-none outline-none text-sm`}
              placeholder="اسم المشارك"
            />
          </div>
          <div className="text-xs text-gray-400 font-arabic">
            {participantType === 'host' ? 'المقدم' : 
             participantType === 'playerA' ? 'لاعب 1' : 'لاعب 2'}
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={addFakeParticipant}
            disabled={hasFakeParticipant || isLoading}
            className={`px-3 py-1 text-xs ${colors.accent} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-arabic transition-colors`}
          >
            {hasFakeParticipant ? 'تم الإضافة' : 'إضافة مشارك وهمي'}
          </button>
          
          <button
            onClick={removeFakeParticipant}
            disabled={!hasFakeParticipant || isLoading}
            className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-arabic transition-colors"
          >
            إزالة المشارك
          </button>

          <button
            onClick={() => setIsConnected(!isConnected)}
            className={`px-3 py-1 text-xs ${
              isConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white rounded font-arabic transition-colors`}
          >
            {isConnected ? 'متصل' : 'غير متصل'}
          </button>
        </div>
      </div>

      {/* Video container */}
      <div 
        ref={containerRef}
        className={`w-full h-full min-h-[200px] max-h-[300px] bg-gray-800 rounded-b-xl border-none ${colors.border} border-t-0`}
        style={{ aspectRatio: '16/9' }}
      >
        {!hasFakeParticipant && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-lg font-arabic mb-2">لا يوجد مشارك</div>
              <div className="text-sm font-arabic">اضغط "إضافة مشارك وهمي" لإضافة فيديو تجريبي</div>
            </div>
          </div>
        )}
      </div>

      {/* Status overlay */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-arabic">
        {hasFakeParticipant ? 'مشارك وهمي نشط' : 'لا يوجد مشارك'}
      </div>
    </div>
  );
}