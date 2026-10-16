import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseConfig } from './config'

/** Supabase client for Server Components, Route Handlers and Server Actions. Returns null if not configured. */
export async function createClient() {
  const cfg = getSupabaseConfig()
  if (!cfg) return null
  const cookieStore = await cookies()
  return createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component — middleware refreshes the session instead.
        }
      },
    },
  })
}
