import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfig } from './config'
import { authCookieOptions, isRemembered, REMEMBER_COOKIE } from './cookies'

/** Refreshes the Supabase auth session cookie (respecting ss_remember) and returns the current user (or null). */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const cfg = getSupabaseConfig()
  if (!cfg) return { response, user: null, supabase: null }
  const remember = isRemembered(request.cookies.get(REMEMBER_COOKIE)?.value)

  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, authCookieOptions(value, options, remember)),
        )
      },
    },
  })

  try {
    // getClaims() verifies the JWT locally (asymmetric keys) and refreshes an expired session; no Auth round trip.
    const { data } = await supabase.auth.getClaims()
    const sub = data?.claims?.sub
    return { response, user: sub ? { id: sub } : null, supabase }
  } catch {
    return { response, user: null, supabase }
  }
}
