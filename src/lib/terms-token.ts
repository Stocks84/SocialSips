/**
 * Signed "terms accepted" cookie: HMAC(userId + "." + termsVersion), so the middleware can skip the DB
 * once a user has accepted the current version. A version bump or another user invalidates it.
 * Key derived from AUTH_THROTTLE_SECRET with its own label (same scheme as the age cookie).
 */
export const TERMS_COOKIE = 'ss-terms'
export const TERMS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const LABEL = 'ss-terms-cookie-v1'
const enc = new TextEncoder()

const b64url = (buf: ArrayBuffer) => { let s = ''; for (const b of new Uint8Array(buf)) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
async function hmac(keyBytes: ArrayBuffer | Uint8Array, msg: string) {
  const key = await crypto.subtle.importKey('raw', keyBytes as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', key, enc.encode(msg))
}
let derived: Promise<ArrayBuffer> | null = null
const termsKey = () => { const s = process.env.AUTH_THROTTLE_SECRET; if (!s) return null; derived ??= hmac(enc.encode(s), LABEL); return derived }

export async function signTermsToken(userId: string, version: string): Promise<string | null> {
  const key = termsKey()
  return key ? b64url(await hmac(await key, `${userId}.${version}`)) : null
}

export async function verifyTermsToken(value: string | undefined, userId: string, version: string): Promise<boolean> {
  if (!value || !/^[A-Za-z0-9_-]{43}$/.test(value)) return false
  const expected = await signTermsToken(userId, version)
  if (!expected) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ value.charCodeAt(i)
  return diff === 0
}

export const termsCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: TERMS_COOKIE_MAX_AGE }
