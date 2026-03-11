import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/api/auth', '/issues'];
const PUBLIC_PREFIXES = ['/issues/'];
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

  // Allow GET requests to /api/issues (public list) and /api/issues/latest
  if (pathname === '/api/issues/latest' || (pathname === '/api/issues' && request.method === 'GET')) {
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
