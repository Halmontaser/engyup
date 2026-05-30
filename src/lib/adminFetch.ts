/**
 * Wrapper around fetch that adds admin authentication headers.
 * Use this for all /admin/api/ calls from the frontend.
 */
export async function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  const password = localStorage.getItem('admin_auth');

  const headers: Record<string, string> = {
    ...(password ? { 'x-admin-password': password } : {}),
  };

  // Only set Content-Type if not already set (e.g., don't override FormData)
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Merge with any headers passed in options
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => { headers[key] = value; });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => { headers[key] = value; });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
