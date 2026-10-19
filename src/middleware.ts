import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { AGE_COOKIE, AGE_DENIED_COOKIE } from '@/lib/age'
import { verifyAgeToken } from '@/lib/age-token'
import { PREVIEW_HEADER } from '@/lib/preview'

/**
 * middleware.ts — Route Protection
 *
 * Runs on EVERY matched request BEFORE the page/API handler:
 *  1. Refreshes the Supabase auth session cookie (@supabase/ssr)
 *  2. Age gate: non-public routes need the ss-age-verified cookie
 *  3. Auth: AUTH_ROUTES need a signed-in user (skipped if Supabase isn't configured yet)
 */

// Routes that are ALWAYS accessible — no auth or age check needed
const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up', '/age-gate', '/age-gate/sorry', '/help', '/auth/callback', '/manifest.json', '/sw.js']

// Known link-preview crawlers, and the only paths they may see without the age gate.
const PREVIEW_BOTS = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|Discordbot|TelegramBot/i
const PREVIEW_PATH = /^\/memes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/og)?$/i

// Write routes that need a signed-in user (in addition to the age gate).
// Guests may browse after the age gate. Comments/ratings are also enforced by RLS
// (auth.uid() = author_id / user_id), so server actions fail for guests.
const AUTH_ROUTES = ['/games/new', '/cocktails/new', '/memes/new', '/profile/edit']
const isAuthRoute = (pathname: string) =>
  AUTH_ROUTES.some((r) => pathname.startsWith(r)) || pathname.endsWith('/edit')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { response, user } = await updateSession(request)

  // ── 1. Allow public routes through immediately ────────────────────────
  // Under-18 answer in the last 24h: keep them on the exit page (no instant retry with another date)
  const denied = !user && request.cookies.get(AGE_DENIED_COOKIE)?.value === '1'
  if (denied && pathname !== '/age-gate/sorry' && !['/', '/help', '/manifest.json', '/sw.js'].includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/age-gate/sorry'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  if (isPublicRoute) return response

  // Link-preview bots may GET a meme's share page and its OG image only (they can't pass the age gate).
  // Without an age cookie or session the page renders a metadata-only stub (no comments, no counts), and
  // only GET/HEAD are allowed, so a spoofed user agent gets nothing beyond the share preview.
  const isPreviewBot = PREVIEW_PATH.test(pathname) && PREVIEW_BOTS.test(request.headers.get('user-agent') ?? '')
  const hasAgeCookie = Boolean(user) || (await verifyAgeToken(request.cookies.get(AGE_COOKIE)?.value))
  if (isPreviewBot && !hasAgeCookie && ['GET', 'HEAD'].includes(request.method)) {
    const headers = new Headers(request.headers)
    headers.set(PREVIEW_HEADER, '1')
    const stub = NextResponse.next({ request: { headers } })
    response.cookies.getAll().forEach((c) => stub.cookies.set(c))
    return stub
  }

  // ── 2. Age gate check ─────────────────────────────────────────────────
  // Signed-in users already passed the 18+ DOB check + confirmation at sign-up (enforced in the DB)
  const ageVerified = hasAgeCookie
  if (!ageVerified) {
    const url = request.nextUrl.clone()
    url.pathname = '/age-gate'
    url.search = ''
    url.searchParams.set('redirectTo', pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // ── 3. Auth check (only when Supabase is configured) ──────────────────
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (supabaseConfigured && !user && isAuthRoute(pathname)) {
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
    '/((?!_next/static|_next/image|favicon\\.ico$|icons/|images/|robots\\.txt$|[^/]+\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
