// Client-side authentication utilities for admin access
// Uses localStorage instead of sessionStorage for better persistence

export function isAdmin(): boolean {
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const sessionPassword = typeof window !== 'undefined'
    ? localStorage.getItem('admin_auth')
    : null;
  return sessionPassword === adminPassword;
}

export function setAdminAuth(password: string): boolean {
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (!adminPassword) return false;
  if (password === adminPassword) {
    localStorage.setItem('admin_auth', password);
    // Set cookie for middleware access (7 days)
    if (typeof document !== 'undefined') {
      document.cookie = `admin_auth=${password}; path=/; max-age=604800; samesite=strict`;
    }
    return true;
  }
  return false;
}

export function clearAdminAuth(): void {
  localStorage.removeItem('admin_auth');
  // Clear cookie
  if (typeof document !== 'undefined') {
    document.cookie = 'admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict';
  }
}

export function hasAdminPassword(): boolean {
  return typeof process.env.NEXT_PUBLIC_ADMIN_PASSWORD === 'string' &&
         process.env.NEXT_PUBLIC_ADMIN_PASSWORD.length > 0;
}
