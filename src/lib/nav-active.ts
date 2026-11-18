/** Paths that belong to the Add control, so /cocktails/new highlights Add rather than Drinks. */
export const ADD_HREFS = ['/games/new', '/cocktails/new'] as const

/** Include both Add destinations in the "best match" set used by isNavActive. */
export function navHrefsForActive(hrefs: readonly string[]): string[] {
  return hrefs.includes('/games/new') && !hrefs.includes('/cocktails/new')
    ? [...hrefs, '/cocktails/new']
    : [...hrefs]
}

/**
 * A tab is active if the path is that tab's href or a child of it, unless a
 * longer nav href is a better match (/games/new is Add, not Games; /games/123 is Games).
 * The Add item (href /games/new) is also active on /cocktails/new.
 */
export function isNavActive(pathname: string, href: string, hrefs: readonly string[]): boolean {
  const isAdd = href === '/games/new'
  const aliases: readonly string[] = isAdd ? ADD_HREFS : [href]
  if (!aliases.some((h) => pathname === h || pathname.startsWith(`${h}/`))) return false
  return !hrefs.some(
    (other) =>
      !aliases.includes(other) &&
      other.length > href.length &&
      (pathname === other || pathname.startsWith(`${other}/`)),
  )
}
