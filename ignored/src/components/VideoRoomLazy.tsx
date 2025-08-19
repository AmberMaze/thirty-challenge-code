import { lazy, Suspense } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

// Lazy load the Daily video component to avoid loading Daily SDK in initial bundle
const VideoRoom = lazy(() => import('./VideoRoom'));

interface VideoRoomLazyProps {
  gameId: string;
  className?: string;
  observerMode?: boolean;
}

// Loading component for video components
function VideoLoadingFallback() {
  const { t } = useTranslation();
  
  return (
    <div className="bg-gray-500/20 border border-gray-500/30 rounded-xl p-6">
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-gray-400 text-base font-bold mb-2">
          {t('loadingVideoComponents')}
        </div>
        <div className="text-gray-300 text-sm">
          {t('preparingVideoConnection')}
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy-loaded wrapper for VideoRoom that code-splits the Daily SDK.
 * This ensures the Daily SDK (240kB+ minified) is only loaded when video functionality is needed.
 */
export default function VideoRoomLazy(props: VideoRoomLazyProps) {
  return (
    <Suspense fallback={<VideoLoadingFallback />}>
      <VideoRoom {...props} />
    </Suspense>
  );
}