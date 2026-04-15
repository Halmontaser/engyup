// Client-side authentication utilities for admin access
// Uses localStorage instead of sessionStorage for better persistence

/**
 * Get the admin password from environment variables
 * In Vite, environment variables are prefixed with VITE_
 */
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

/**
 * Check if current user is authenticated as admin
 */
export function isAdmin(): boolean {
  if (!ADMIN_PASSWORD) return false;

  const sessionPassword = typeof window !== 'undefined'
    ? localStorage.getItem('admin_auth')
    : null;

  return sessionPassword === ADMIN_PASSWORD;
}

/**
 * Set admin authentication
 * @param password - The admin password to verify
 * @returns true if authentication successful, false otherwise
 */
export function setAdminAuth(password: string): boolean {
  if (!ADMIN_PASSWORD) {
    console.warn('VITE_ADMIN_PASSWORD is not set in environment variables');
    return false;
  }

  if (password === ADMIN_PASSWORD) {
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_auth', password);

      // Set cookie for middleware access (7 days)
      document.cookie = `admin_auth=${password}; path=/; max-age=604800; samesite=strict`;
    }

    console.log('Admin authentication successful');
    return true;
  }

  console.warn('Admin authentication failed: Invalid password');
  return false;
}

/**
 * Clear admin authentication
 */
export function clearAdminAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_auth');

    // Clear cookie
    document.cookie = 'admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict';
  }

  console.log('Admin authentication cleared');
}

/**
 * Check if admin password is configured
 */
export function hasAdminPassword(): boolean {
  return typeof ADMIN_PASSWORD === 'string' && ADMIN_PASSWORD.length > 0;
}

/**
 * Get admin password status for debugging
 */
export function getAdminAuthStatus(): {
  isConfigured: boolean;
  isAuthenticated: boolean;
} {
  return {
    isConfigured: hasAdminPassword(),
    isAuthenticated: isAdmin(),
  };
}
