import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
const PUBLIC_PREFIXES = ['/api/auth/', '/_next/', '/favicon', '/assets/'];

function isPublic(pathname: string): boolean {
  if (pathname === '/') return true;
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // If Supabase isn't configured, let the request through — layouts handle preview mode.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  // Only enforce auth gates once Supabase is configured.
  if (isPublic(pathname)) {
    return response;
  }

  // Check session cookie cheaply by looking for the supabase auth cookie.
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
