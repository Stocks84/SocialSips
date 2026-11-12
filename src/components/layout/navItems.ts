export const navItems = [
  { href: '/feed', label: 'Feed', emoji: '✨' },
  { href: '/games', label: 'Games', emoji: '🎮' },
  { href: '/cocktails', label: 'Cocktails', emoji: '🍹' },
  { href: '/games/new', label: 'Add', emoji: '➕' },
  { href: '/memes', label: 'Memes', emoji: '😂' },
  { href: '/play', label: 'Play', emoji: '🎲' },
  { href: '/challenge', label: 'Challenge', emoji: '🏆' },
  { href: '/help', label: 'Help', emoji: '🙏' },
] as const

/** Only rendered when the server says the viewer is an admin (getViewer().isAdmin). */
export const adminNavItem = { href: '/admin', label: 'Admin', emoji: '🛡️' } as const

export type NavItem = { href: string; label: string; emoji: string }

/**
 * A tab is active if the path is that tab's href or a child of it, unless a
 * longer nav href is a better match (/games/new is Add, not Games; /games/123 is Games).
 */
export function isNavActive(pathname: string, href: string, hrefs: readonly string[]): boolean {
  if (pathname !== href && !pathname.startsWith(`${href}/`)) return false
  return !hrefs.some(
    (other) =>
      other !== href &&
      other.length > href.length &&
      (pathname === other || pathname.startsWith(`${other}/`)),
  )
}
