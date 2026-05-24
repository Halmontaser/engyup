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

  console.log('[getMediaUrl] CDN URL:', cdnUrl, 'Path:', path);

  if (cdnUrl) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const cleanCdn = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;

    const finalUrl = `${cleanCdn}/${cleanPath}`;
    console.log('[getMediaUrl] Final URL:', finalUrl);
    return finalUrl;
  }

  // Fallback: local development from public/ folder
  const localUrl = path.startsWith('/') ? path : `/${path}`;
  console.log('[getMediaUrl] Using local URL:', localUrl);
  return localUrl;
}
