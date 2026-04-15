'use client';

import { useState, useRef, useEffect } from 'react';
import { audioLoader, checkFormatSupport } from '@/lib/optimizedMediaLoader';

interface OptimizedAudioProps {
  src: string;
  text?: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
  showText?: boolean;
}

/**
 * Optimized Audio Player
 * - Loads audio only when needed (lazy loading)
 * - Uses optimized formats (Opus, AAC) when supported
 * - Progressively loads: metadata first, then full audio
 * - Shows transcription when available
 */
export function OptimizedAudio({
  src,
  text,
  autoPlay = false,
  onPlay,
  onPause,
  onEnded,
  className = '',
  showText = false,
}: OptimizedAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load optimized audio format based on browser support
  useEffect(() => {
    const formatSupport = checkFormatSupport();

    async function loadAudio() {
      if (!audioRef.current) return;

      try {
        setIsLoading(true);
        const audio = await audioLoader.load(src, formatSupport);

        // Copy properties from loaded audio
        audioRef.current.src = audio.src;
        audioRef.current.currentTime = 0;

        setDuration(audio.duration || 0);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading audio:', error);
        setIsLoading(false);
      }
    }

    loadAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [src]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration || 1;
      setProgress((current / total) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const percent = parseFloat(e.target.value);
    const time = (percent / 100) * (audioRef.current.duration || 0);
    audioRef.current.currentTime = time;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <audio
        ref={audioRef}
        onPlay={() => {
          setIsPlaying(true);
          onPlay?.();
        }}
        onPause={() => {
          setIsPlaying(false);
          onPause?.();
        }}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration || 0)}
        preload="metadata"
      />

      {/* Audio Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="flex items-center justify-center w-12 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-full transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            disabled={isLoading || duration === 0}
          />
        </div>

        <span className="text-sm text-gray-600 min-w-[80px]">
          {formatTime((progress / 100) * duration)} / {formatTime(duration)}
        </span>
      </div>

      {/* Transcription Text */}
      {showText && text && (
        <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
          <span className="font-medium text-gray-900">Transcription:</span> {text}
        </p>
      )}
    </div>
  );
}
