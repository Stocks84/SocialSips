import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { AGE_COOKIE } from '@/lib/age'

/**
 * middleware.ts — Route Protection
 *
 * Runs on EVERY matched request BEFORE the page/API handler:
 *  1. Refreshes the Supabase auth session cookie (@supabase/ssr)
 *  2. Age gate: non-public routes need the ss-age-verified cookie
 *  3. Auth: AUTH_ROUTES need a signed-in user (skipped if Supabase isn't configured yet)
 */

// Routes that are ALWAYS accessible — no auth or age check needed
const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up', '/age-gate', '/help', '/auth/callback', '/manifest.json', '/sw.js']

// Routes that need a signed-in user (in addition to the age gate)
const AUTH_ROUTES = ['/games/new']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { response, user } = await updateSession(request)

  // ── 1. Allow public routes through immediately ────────────────────────
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith('/api/')
  )
  if (isPublicRoute) return response

  // ── 2. Age gate check ─────────────────────────────────────────────────
  const ageVerified = request.cookies.get(AGE_COOKIE)?.value === 'true'
  if (!ageVerified) {
    const url = request.nextUrl.clone()
    url.pathname = '/age-gate'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // ── 3. Auth check (only when Supabase is configured) ──────────────────
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (supabaseConfigured && !user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

/**
 * Matcher config — controls which paths the middleware runs on.
 *
 * We EXCLUDE:
 *  - Next.js internals (_next/static, _next/image)
 *  - favicon and static asset files
 *
 * We INCLUDE everything else (pages, API routes, etc.)
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icons/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}
