import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { cookies } from 'next/headers'
import { getSupabaseConfig } from './config'
import { authCookieOptions, isRemembered, REMEMBER_COOKIE } from './cookies'

/**
 * Supabase client for Server Components, Route Handlers and Server Actions. Returns null if not configured.
 * `remember` overrides the ss_remember cookie (used by sign-in/sign-up, where the choice is being made now).
 */
export async function createClient(opts: { remember?: boolean } = {}) {
  const cfg = getSupabaseConfig()
  if (!cfg) return null
  const cookieStore = await cookies()
  return createServerClient<Database>(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        const remember = opts.remember ?? isRemembered(cookieStore.get(REMEMBER_COOKIE)?.value)
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, authCookieOptions(value, options, remember)),
          )
        } catch {
          // Called from a Server Component — middleware refreshes the session instead.
        }
      },
    },
  })
}
