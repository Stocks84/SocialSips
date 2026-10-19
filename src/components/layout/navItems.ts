export const navItems = [
  { href: '/feed', label: 'Feed', emoji: '🎮' },
  { href: '/cocktails', label: 'Cocktails', emoji: '🍹' },
  { href: '/games/new', label: 'Add', emoji: '➕' },
  { href: '/memes', label: 'Memes', emoji: '😂' },
  { href: '/play', label: 'Play', emoji: '🎲' },
  { href: '/help', label: 'Help', emoji: '🙏' },
] as const

/** Only rendered when the server says the viewer is an admin (getViewer().isAdmin). */
export const adminNavItem = { href: '/admin', label: 'Admin', emoji: '🛡️' } as const
