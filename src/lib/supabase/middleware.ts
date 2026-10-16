import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfig } from './config'

/** Refreshes the Supabase auth session cookie and returns the current user (or null). */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const cfg = getSupabaseConfig()
  if (!cfg) return { response, user: null }

  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  try {
    const { data: { user } } = await supabase.auth.getUser()
    return { response, user }
  } catch {
    return { response, user: null }
  }
}
