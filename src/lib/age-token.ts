/**
 * Signed age-gate cookie: "<expiry ms>.<HMAC-SHA256>" so the value can't be typed in by hand.
 * Web Crypto only, so it runs in middleware (Edge) and in server actions (Node).
 * Key: HMAC of a fixed label with the server-only AUTH_THROTTLE_SECRET (separate derived key, same env var).
 */
const LABEL = 'ss-age-cookie-v1'
const enc = new TextEncoder()

function b64url(buf: ArrayBuffer) {
  let s = ''
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(keyBytes: ArrayBuffer | Uint8Array, msg: string) {
  const key = await crypto.subtle.importKey('raw', keyBytes as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', key, enc.encode(msg))
}

let derived: Promise<ArrayBuffer> | null = null
function ageKey(): Promise<ArrayBuffer> | null {
  const secret = process.env.AUTH_THROTTLE_SECRET
  if (!secret) return null
  derived ??= hmac(enc.encode(secret), LABEL)
  return derived
}

/** New cookie value valid for maxAgeSeconds. Null if the server secret is missing. */
export async function signAgeToken(maxAgeSeconds: number, now = Date.now()): Promise<string | null> {
  const key = ageKey()
  if (!key) return null
  const exp = String(now + maxAgeSeconds * 1000)
  return `${exp}.${b64url(await hmac(await key, exp))}`
}

/** True only for an unexpired value signed with our key. */
export async function verifyAgeToken(value: string | undefined, now = Date.now()): Promise<boolean> {
  if (!value) return false
  const key = ageKey()
  if (!key) {
    console.error('AUTH_THROTTLE_SECRET is not set; age cookie falls back to the unsigned value')
    return value === 'true'
  }
  const m = /^(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(value)
  if (!m || Number(m[1]) <= now) return false
  const expected = b64url(await hmac(await key, m[1]))
  // constant-time compare
  let diff = expected.length ^ m[2].length
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ (m[2].charCodeAt(i) || 0)
  return diff === 0
}
