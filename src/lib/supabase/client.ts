'use client'
import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from './config'
import { authCookieOptions, isRemembered, REMEMBER_COOKIE } from './cookies'

function readCookies() {
  return document.cookie
    .split('; ')
    .filter(Boolean)
    .map((c) => {
      const i = c.indexOf('=')
      return { name: decodeURIComponent(c.slice(0, i)), value: decodeURIComponent(c.slice(i + 1)) }
    })
}

/** Supabase client for Client Components (respects ss_remember on refresh). Returns null if env is not configured. */
export function createClient() {
  const cfg = getSupabaseConfig()
  if (!cfg) return null
  return createBrowserClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll: readCookies,
      setAll(cookiesToSet) {
        const remember = isRemembered(readCookies().find((c) => c.name === REMEMBER_COOKIE)?.value)
        cookiesToSet.forEach(({ name, value, options }) => {
          const o = authCookieOptions(value, options, remember)
          let s = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${o.path ?? '/'}; samesite=${o.sameSite ?? 'lax'}`
          if (o.maxAge !== undefined) s += `; max-age=${o.maxAge}`
          if (o.secure || location.protocol === 'https:') s += '; secure'
          document.cookie = s
        })
      },
    },
  })
}
