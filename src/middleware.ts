import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin password is required from environment
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

// Paths that require authentication
const protectedPaths = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath) {
    // If no admin password is set, deny access
    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Admin password not configured. Set NEXT_PUBLIC_ADMIN_PASSWORD environment variable.' },
        { status: 500 }
      );
    }

    // Check if user is authenticated via cookie
    const authCookie = request.cookies.get('admin_auth');

    // Allow the login page itself
    if (pathname === '/admin/login' || pathname === '/admin') {
      return NextResponse.next();
    }

    // Redirect to login if not authenticated
    if (!authCookie || authCookie.value !== ADMIN_PASSWORD) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};
