import 'server-only'
import { siteUrl } from '@/lib/site-url'

/** Canonical site origin for OG and share URLs. Same source as sign-up redirects; never the request Host. */
export function siteOrigin(): string {
  return siteUrl()
}

export const snippet = (s: string | null | undefined, max: number) => {
  const t = (s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}
