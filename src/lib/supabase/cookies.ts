import type { CookieOptions } from '@supabase/ssr'

/** Non-auth cookie storing the "Keep me signed in" choice: '1' (default) or '0'. */
export const REMEMBER_COOKIE = 'ss_remember'
/** Browsers cap cookie lifetime at 400 days. */
export const REMEMBER_MAX_AGE = 400 * 24 * 60 * 60

/** Missing cookie → remembered (default for existing sessions and sign-up). */
export const isRemembered = (value: string | undefined | null) => value !== '0'

/**
 * Applies the remember choice to a Supabase auth cookie's options on every write (sign-in and token refresh).
 * Deletions (empty value / maxAge 0) are left untouched so sign-out still clears cookies.
 */
export function authCookieOptions(value: string, options: CookieOptions | undefined, remember: boolean): CookieOptions {
  const opts: CookieOptions = { ...(options ?? {}) }
  if (value === '' || opts.maxAge === 0) return opts
  if (remember) {
    opts.maxAge = REMEMBER_MAX_AGE
  } else {
    delete opts.maxAge // session cookie: cleared when the browser closes
    delete opts.expires
  }
  return opts
}

/** Options for the ss_remember cookie itself (session cookie when not remembering). */
export function rememberCookieOptions(remember: boolean): CookieOptions {
  return {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
  }
}
