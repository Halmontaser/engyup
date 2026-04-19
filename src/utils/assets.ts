/**
 * Utility to resolve media asset URLs based on environment configuration.
 * When VITE_CDN_URL is provided, it serves assets from Cloudflare R2.
 */
export function getMediaUrl(path?: string | null): string {
  if (!path) return '';

  // If path is already absolute, return immediately
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Fallback to VITE_CDN_URL for Cloudflare R2
  const cdnUrl = import.meta.env.VITE_CDN_URL;
  
  if (cdnUrl) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const cleanCdn = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;
    
    // Some old URLs might hardcode /media. Let's make sure it's handled safely
    return `${cleanCdn}/${cleanPath}`;
  }

  // Fallback: local development from public/ folder
  return path.startsWith('/') ? path : `/${path}`;
}
