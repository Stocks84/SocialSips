/** Absolute share URL for a site path. Pass the trusted site origin (siteUrl()), so it follows NEXT_PUBLIC_SITE_URL. */
export function absoluteShareUrl(path: string, origin: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${origin}${p}`
}
