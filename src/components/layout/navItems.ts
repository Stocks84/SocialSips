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
  { href: '/cocktails', label: 'Drinks', icon: faMartiniGlassCitrus },
  { href: '/games/new', label: 'Add', icon: faPlus },
  { href: '/memes', label: 'Memes', icon: faFaceGrinSquintTears },
  { href: '/play', label: 'Play', icon: faDice },
  { href: '/challenge', label: 'Dares', icon: faTrophy },
  { href: '/help', label: 'Help', icon: faCircleQuestion }, // desktop top nav only; filtered out of the tab bar
] as const

/** Only rendered when the server says the viewer is an admin (getViewer().isAdmin). */
export const adminNavItem = { href: '/admin', label: 'Admin', icon: faShieldHalved } as const

/** `tabLabel` is a shorter label for the mobile tab bar (fits at 360px); the desktop nav uses `label`. */
export type NavItem = { href: string; label: string; tabLabel?: string; icon: IconDefinition }

export { isNavActive, navHrefsForActive, ADD_HREFS } from '@/lib/nav-active'
