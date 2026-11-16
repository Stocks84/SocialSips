import 'server-only'
import { siteUrl } from '@/lib/site-url'

/** Canonical site origin for OG and share URLs. Same source as sign-up redirects; never the request Host. */
export function siteOrigin(): string {
  return siteUrl()
}

export { snippet } from '@/lib/share-meta'
