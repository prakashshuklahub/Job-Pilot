import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthEnabled, verifySessionCookie } from '@/lib/auth';

const PUBLIC_PATHS = ['/login'];
const PUBLIC_API_PREFIXES = ['/api/auth/'];
const CRON_PATH = '/api/cron/scan';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname === CRON_PATH
  ) {
    return NextResponse.next();
  }

  if (!isAuthEnabled()) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('UI_PASSWORD is not configured', { status: 503 });
    }
    return NextResponse.next();
  }

  const cookie = request.cookies.get('career_ops_auth')?.value;
  if (await verifySessionCookie(cookie)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const login = new URL('/login', request.url);
  if (pathname !== '/') login.searchParams.set('from', pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
