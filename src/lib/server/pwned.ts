import { createHash } from 'node:crypto'

// Have I Been Pwned "Pwned Passwords" check (free, no API key) using k-anonymity:
// only the first 5 hex chars of the SHA-1 hash leave the server; suffixes are compared locally.
// Add-Padding makes every response a similar size, so the prefix can't be guessed from traffic.
// Never log the password or its hash. No 'server-only' import so the pure function stays unit-testable;
// node:crypto keeps it out of client bundles anyway.

const RANGE_URL = 'https://api.pwnedpasswords.com/range/'
const DEFAULT_TIMEOUT_MS = 3000

export type PwnedOptions = { fetchImpl?: typeof fetch; timeoutMs?: number }

/**
 * How many times the password appears in known breaches (0 = not found),
 * or null if the check could not be done (network error, timeout, bad response).
 */
export async function pwnedCount(password: string, opts: PwnedOptions = {}): Promise<number | null> {
  const { fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = opts
  const hash = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase()
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)
  try {
    const res = await fetchImpl(RANGE_URL + prefix, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'SocialSips-signup-check' },
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = await res.text()
    for (const line of body.split('\n')) {
      const [s, c] = line.trim().split(':')
      // Padding rows have count 0, so they never match as "pwned".
      if (s === suffix) return Number.parseInt(c ?? '0', 10) || 0
    }
    return 0
  } catch {
    return null
  }
}

/** True only if the password is known to be breached. Fails open (false) if HIBP can't be reached. */
export async function isPwnedPassword(password: string, opts?: PwnedOptions): Promise<boolean> {
  const count = await pwnedCount(password, opts)
  if (count === null) {
    console.warn('Pwned Passwords check unavailable; allowing password (fail open)')
    return false
  }
  return count > 0
}

export const PWNED_PASSWORD_MESSAGE =
  'That password has shown up in a data breach somewhere, so it’s easy to guess. Please pick a different one.'
