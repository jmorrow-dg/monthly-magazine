import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/api/auth', '/issues', '/latest'];
const PUBLIC_PREFIXES = ['/issues/', '/api/cron/'];
const STATIC_PREFIXES = ['/_next', '/images', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow exact public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public issue viewer and API reads
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow GET requests to public issue API endpoints
  if (request.method === 'GET') {
    if (
      pathname === '/api/issues/latest'
      || pathname === '/api/issues'
      || pathname.match(/^\/api\/issues\/[^/]+\/render$/)
      || pathname.match(/^\/api\/issues\/[^/]+$/)
    ) {
      return NextResponse.next();
    }
  }

  // Allow public unsubscribe endpoint (accessed from email links)
  if (pathname.match(/^\/api\/subscribers\/[^/]+\/unsubscribe$/) && request.method === 'GET') {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get('dg-magazine-session')?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verify token structure
  const parts = sessionToken.split('.');
  if (parts.length !== 2) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));
    if (Date.now() > payload.expires) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
