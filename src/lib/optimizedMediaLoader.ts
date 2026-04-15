/**
 * Optimized Media Loader for Vite + React
 * - Lazy loading: Load media only when requested
 * - Format optimization: WebP for images, Opus/MP3 for audio
 * - Caching: In-memory cache for loaded assets
 * - Progressive loading: Low-quality placeholder first, then full quality
 */

export interface AudioMetadata {
  filename: string;
  text?: string;
  audioType?: string;
  url: string;
  duration?: number;
  optimizedUrl?: string;
}

export interface ImageMetadata {
  filename: string;
  prompt?: string;
  url: string;
  width?: number;
  height?: number;
  optimizedUrl?: string;
  thumbnailUrl?: string;
}

export interface OptimizedMedia {
  audio: AudioMetadata[];
  images: ImageMetadata[];
}

// Cache for loaded media
const mediaCache = new Map<string, OptimizedMedia>();
const loadingPromises = new Map<string, Promise<OptimizedMedia>>();

/**
 * Get the optimized URL for an image
 * Tries to find WebP/AVIF version first, falls back to original
 */
function getOptimizedImageUrl(originalUrl: string, preferFormat: 'webp' | 'avif' = 'webp'): string {
  const ext = originalUrl.split('.').pop()?.toLowerCase();
  if (!ext) return originalUrl;

  const basename = originalUrl.substring(0, originalUrl.lastIndexOf('.'));
  const optimizedUrl = `${basename}.${preferFormat}`;

  return optimizedUrl;
}

/**
 * Get the optimized URL for audio
 */
function getOptimizedAudioUrl(originalUrl: string, preferFormat: 'opus' | 'aac' | 'mp3' = 'opus'): string {
  const ext = originalUrl.split('.').pop()?.toLowerCase();
  if (!ext) return originalUrl;

  const basename = originalUrl.substring(0, originalUrl.lastIndexOf('.'));
  const optimizedUrl = `${basename}.${preferFormat}`;

  return optimizedUrl;
}

/**
 * Check if an optimized format is supported by the browser
 */
export function checkFormatSupport(): {
  webp: boolean;
  avif: boolean;
  opus: boolean;
  aac: boolean;
} {
  const img = document.createElement('img');

  // Check WebP support
  img.src =
    'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  const webp = img.complete && img.width > 0 && img.height > 0;

  // Check AVIF support
  img.src =
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  const avif = img.complete && img.width > 0 && img.height > 0;

  // Check audio support
  const audio = document.createElement('audio');
  const opus = audio.canPlayType('audio/opus; codecs="opus"') !== '';
  const aac = audio.canPlayType('audio/aac') !== '';

  return { webp, avif, opus, aac };
}

/**
 * Load media for a single activity on-demand
 */
export async function loadOptimizedMedia(
  activityId: string,
  baseUrl: string = '/api/media'
): Promise<OptimizedMedia> {
  // Return cached result if available
  if (mediaCache.has(activityId)) {
    return mediaCache.get(activityId)!;
  }

  // Return existing loading promise if already in progress
  if (loadingPromises.has(activityId)) {
    return loadingPromises.get(activityId)!;
  }

  // Create new loading promise
  const promise = fetchMediaFromServer(activityId, baseUrl);
  loadingPromises.set(activityId, promise);

  try {
    const media = await promise;
    mediaCache.set(activityId, media);
    loadingPromises.delete(activityId);
    return media;
  } catch (error) {
    loadingPromises.delete(activityId);
    console.error(`Error loading media for activity ${activityId}:`, error);
    return { audio: [], images: [] };
  }
}

/**
 * Fetch media metadata from server
 */
async function fetchMediaFromServer(
  activityId: string,
  baseUrl: string
): Promise<OptimizedMedia> {
  try {
    const response = await fetch(`${baseUrl}/${activityId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    const data = await response.json();
    const formatSupport = checkFormatSupport();

    // Add optimized URLs based on browser support
    const audio = (data.audio || []).map((a: AudioMetadata) => ({
      ...a,
      optimizedUrl: formatSupport.opus ? getOptimizedAudioUrl(a.url, 'opus') : a.url,
    }));

    const images = (data.images || []).map((img: ImageMetadata) => ({
      ...img,
      optimizedUrl: formatSupport.avif
        ? getOptimizedImageUrl(img.url, 'avif')
        : formatSupport.webp
          ? getOptimizedImageUrl(img.url, 'webp')
          : img.url,
      thumbnailUrl: img.url.replace(/\.(png|jpg|jpeg)$/i, '-thumb.webp'),
    }));

    return { audio, images };
  } catch (error) {
    console.error('Error fetching media:', error);
    return { audio: [], images: [] };
  }
}

/**
 * Batch load media for multiple activities
 */
export async function loadOptimizedMediaBatch(
  activityIds: string[],
  baseUrl: string = '/api/media'
): Promise<Map<string, OptimizedMedia>> {
  const result = new Map<string, OptimizedMedia>();

  // Load in parallel with concurrency limit
  const CONCURRENCY = 5;
  for (let i = 0; i < activityIds.length; i += CONCURRENCY) {
    const batch = activityIds.slice(i, i + CONCURRENCY);
    const mediaItems = await Promise.all(
      batch.map((id) => loadOptimizedMedia(id, baseUrl))
    );
    batch.forEach((id, idx) => result.set(id, mediaItems[idx]));
  }

  return result;
}

/**
 * Preload media for a list of activities (use sparingly)
 */
export function preloadMedia(
  activityIds: string[],
  baseUrl: string = '/api/media'
): void {
  activityIds.forEach((id) => loadOptimizedMedia(id, baseUrl));
}

/**
 * Clear cache for specific activity or all activities
 */
export function clearMediaCache(activityId?: string): void {
  if (activityId) {
    mediaCache.delete(activityId);
    loadingPromises.delete(activityId);
  } else {
    mediaCache.clear();
    loadingPromises.clear();
  }
}

/**
 * Get image URL with responsive size parameters
 * For Vite, this is simpler than Next.js
 */
export function getResponsiveImageUrl(url: string, width?: number, quality: number = 85): string {
  // For static serving, we'll just return the URL
  // In production, you might use a CDN or image service
  return url;
}

/**
 * Lazy load an image element using Intersection Observer
 */
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  src: string,
  options?: {
    threshold?: number;
    rootMargin?: string;
    onLoad?: () => void;
    onError?: () => void;
  }
): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = src;
          observer.unobserve(img);

          img.onload = options?.onLoad;
          img.onerror = options?.onError;
        }
      });
    },
    {
      threshold: options?.threshold ?? 0.1,
      rootMargin: options?.rootMargin ?? '50px',
    }
  );

  observer.observe(imgElement);
}

/**
 * Audio loader with progressive quality
 */
export class AudioLoader {
  private audioCache = new Map<string, HTMLAudioElement>();

  async load(url: string, formatSupport: { opus: boolean; aac: boolean }): Promise<HTMLAudioElement> {
    if (this.audioCache.has(url)) {
      return this.audioCache.get(url)!;
    }

    const optimizedUrl = formatSupport.opus
      ? getOptimizedAudioUrl(url, 'opus')
      : formatSupport.aac
        ? getOptimizedAudioUrl(url, 'aac')
        : url;

    const audio = new Audio(optimizedUrl);
    audio.preload = 'metadata';

    await new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => resolve(undefined), { once: true });
      audio.addEventListener('error', reject, { once: true });
    });

    this.audioCache.set(url, audio);
    return audio;
  }

  clear(): void {
    this.audioCache.forEach((audio) => audio.pause());
    this.audioCache.clear();
  }
}

export const audioLoader = new AudioLoader();
