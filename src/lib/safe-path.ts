/**
 * Returns `input` only if it is a same-site path ("/feed?x=1"), otherwise `fallback`.
 * Rejects protocol-relative ("//evil.com"), backslash ("/\evil.com"), schemes, control chars and
 * anything that resolves to another origin (e.g. "@evil.com" tricks).
 */
export function safePath(input: unknown, fallback = '/feed'): string {
  if (typeof input !== 'string') return fallback
  const s = input.trim()
  if (!s.startsWith('/') || s.startsWith('//') || s.includes('\\') || /[\u0000-\u001f\u007f]/.test(s)) return fallback
  try {
    const base = 'https://safe.invalid'
    const u = new URL(s, base)
    const out = `${u.pathname}${u.search}${u.hash}`
    // normalisation can turn "/..//evil.com" into "//evil.com"
    if (u.origin !== base || out.startsWith('//') || out.includes('\\')) return fallback
    return out
  } catch {
    return fallback
  }
}
