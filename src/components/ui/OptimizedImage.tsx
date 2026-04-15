'use client';

import { useState, useRef, useEffect } from 'react';
import { getResponsiveImageUrl, lazyLoadImage, checkFormatSupport } from '@/lib/optimizedMediaLoader';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  placeholder?: 'blur' | 'empty';
  quality?: number;
  priority?: boolean;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
}

/**
 * Optimized Image Component for Vite + React
 * - Supports lazy loading by default
 * - Progressive enhancement with low-quality placeholders
 * - Responsive sizing
 * - Format optimization (WebP/AVIF)
 */
export function OptimizedImage({
  src,
  alt,
  width = '100%',
  height = 'auto',
  className = '',
  placeholder = 'blur',
  quality = 85,
  priority = false,
  lazy = true,
  onLoad,
  onError,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check browser support for optimized formats
  const formatSupport = checkFormatSupport();

  useEffect(() => {
    const optimizedUrl = getResponsiveImageUrl(src, typeof width === 'number' ? width : undefined, quality);
    setCurrentSrc(optimizedUrl);
  }, [src, width, quality]);

  // Lazy load unless priority or lazy is false
  useEffect(() => {
    if (!priority && lazy && imgRef.current) {
      lazyLoadImage(imgRef.current, currentSrc, {
        onLoad: () => {
          setIsLoading(false);
          onLoad?.();
        },
        onError: () => {
          setError(true);
          onError?.();
        },
      });
    } else if ((priority || !lazy) && imgRef.current) {
      // Load immediately if priority or not lazy
      imgRef.current.src = currentSrc;
    }
  }, [currentSrc, priority, lazy, onLoad, onError]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 ${className}`}
        style={{ width: typeof width === 'string' ? width : `${width}px`, height: typeof height === 'string' ? height : `${height}px` }}
      >
        <span className="text-gray-500 text-sm">Image not available</span>
      </div>
    );
  }

  const placeholderDataUrl = placeholder === 'blur'
    ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4='
    : undefined;

  return (
    <div
      className={`relative ${className}`}
      style={{ width: typeof width === 'string' ? width : `${width}px`, height: typeof height === 'string' ? height : `${height}px` }}
    >
      {isLoading && placeholder === 'blur' && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}

      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        sizes={lazy ? sizes : undefined}
        loading={lazy && !priority ? 'lazy' : undefined}
        className={`transition-opacity duration-300 w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => {
          setError(true);
          onError?.();
        }}
        style={{
          width: typeof width === 'string' ? width : '100%',
          height: typeof height === 'string' ? height : '100%',
        }}
      />
    </div>
  );
}
