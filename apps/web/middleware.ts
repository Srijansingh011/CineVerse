import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('refreshToken');
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const protectedPaths = ['/admin', '/theatre-owner', '/profile'];
  
  const requiresAuth = protectedPaths.some(path => pathname.startsWith(path));

  if (requiresAuth && !token) {
    // Redirect to login page and keep track of where they wanted to go
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // If user is logged in, don't let them visit login/register again
  if (token && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/theatre-owner/:path*',
    '/profile/:path*',
    '/login',
    '/register',
  ],
};
