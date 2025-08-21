import { useState, useEffect } from 'react';

interface LazyImageProps {
  src: string | (() => Promise<string>);
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function LazyImage({
  src,
  alt,
  className,
  fallback,
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(false);

        if (typeof src === 'string') {
          setImageSrc(src);
        } else {
          const url = await src();
          setImageSrc(url);
        }
      } catch (err) {
        console.error('Failed to load image:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [src]);

  if (isLoading) {
    return (
      fallback || (
        <div className={`bg-gray-300 animate-pulse ${className}`}>
          <div className="w-full h-full bg-gray-200 rounded"></div>
        </div>
      )
    );
  }

  if (error || !imageSrc) {
    return (
      <div
        className={`bg-gray-300 flex items-center justify-center ${className}`}
      >
        <span className="text-gray-500 text-xs">?</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
