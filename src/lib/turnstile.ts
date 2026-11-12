/**
 * Cloudflare Turnstile (sign-up / sign-in CAPTCHA). The site key is public; Supabase Auth verifies
 * the token server-side with the secret, so the app itself never needs the secret.
 * Override with NEXT_PUBLIC_TURNSTILE_SITE_KEY (e2e uses Cloudflare's always-pass test key).
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAF-3CY0z3Pebwn3v'

/** Name of the hidden field Turnstile adds to the enclosing form. */
export const TURNSTILE_FIELD = 'cf-turnstile-response'
