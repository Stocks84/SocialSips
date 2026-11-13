import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faNewspaper,
  faBeerMugEmpty,
  faMartiniGlassCitrus,
  faPlus,
  faFaceGrinSquintTears,
  faDice,
  faTrophy,
  faCircleQuestion,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'

export const navItems = [
  { href: '/feed', label: 'Feed', icon: faNewspaper },
  { href: '/games', label: 'Games', icon: faBeerMugEmpty }, // Font Awesome Free has no spade
  { href: '/cocktails', label: 'Cocktails', icon: faMartiniGlassCitrus },
  { href: '/games/new', label: 'Add', icon: faPlus },
  { href: '/memes', label: 'Memes', icon: faFaceGrinSquintTears },
  { href: '/play', label: 'Play', icon: faDice },
  { href: '/challenge', label: 'Challenge', icon: faTrophy },
  { href: '/help', label: 'Help', icon: faCircleQuestion }, // desktop top nav only; filtered out of the tab bar
] as const

/** Only rendered when the server says the viewer is an admin (getViewer().isAdmin). */
export const adminNavItem = { href: '/admin', label: 'Admin', icon: faShieldHalved } as const

export type NavItem = { href: string; label: string; icon: IconDefinition }

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
