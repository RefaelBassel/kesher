import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { routing } from '@/lib/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  // Refresh Supabase session cookies and sync admin role on every navigation.
  // Wrapped in try/catch so a missing Supabase env never breaks routing.
  try {
    await updateSession(request, response);
  } catch (e) {
    console.warn('[middleware] supabase session update skipped:', (e as Error).message);
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
