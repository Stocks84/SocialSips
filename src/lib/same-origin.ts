/**
 * CSRF guard for state-changing route handlers (POST/DELETE).
 * Mirrors Next's server-action check: the browser's Origin must match the host the request came to.
 * With no Origin header, only an explicit `Sec-Fetch-Site: same-origin` passes; otherwise refuse.
 */
export function isSameOrigin(h: { get(name: string): string | null }): boolean {
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(',')[0].trim().toLowerCase()
  const origin = h.get('origin')
  if (origin && origin !== 'null') {
    try {
      return host !== '' && new URL(origin).host.toLowerCase() === host
    } catch {
      return false
    }
  }
  if (origin === 'null') return false
  return h.get('sec-fetch-site') === 'same-origin'
}
