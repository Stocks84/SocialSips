/** First-visit welcome prompt: who should see it, and the links it offers. */

/** Accounts created before this never see the prompt (existing members are not spammed). */
export const WELCOME_AFTER = '2026-11-18T00:00:00.000Z'
export const WELCOME_AFTER_MS = Date.parse(WELCOME_AFTER)

/** localStorage flag set when the prompt is dismissed or a link in it is followed. */
export const WELCOME_STORAGE_KEY = 'ss-welcome-dismissed'

export type WelcomeProfile = {
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
}

export const WELCOME_LINKS = [
  { href: '/games', label: 'Browse Games', testId: 'welcome-games' },
  { href: '/games/new', label: 'Add a game', testId: 'welcome-add-game' },
  { href: '/cocktails/new', label: 'Add a drink', testId: 'welcome-add-drink' },
  { href: '/challenge', label: "This week's Dare", testId: 'welcome-dare' },
] as const

export const WELCOME_PROFILE_LINK = {
  href: '/settings/profile',
  label: 'Finish your profile',
  testId: 'welcome-profile',
} as const

/** Optional hint: find a friend via the link they sent, never via search or suggestions. */
export const WELCOME_FRIEND_LINE =
  'Invited by a friend? Open their profile link and tap Follow. You can Share yours from your profile.'

/**
 * Show the prompt only to accounts created on/after WELCOME_AFTER that have not
 * already dismissed it. `dismissed` is true when localStorage or profiles.welcome_dismissed_at says so.
 */
export function shouldShowWelcome(input: {
  createdAt?: string | null
  dismissed?: boolean
  now?: number
}): boolean {
  if (input.dismissed) return false
  if (!input.createdAt) return false
  const created = Date.parse(input.createdAt)
  if (!Number.isFinite(created)) return false
  const now = input.now ?? Date.now()
  return created >= WELCOME_AFTER_MS && created <= now + 60_000
}

/** Offer "Finish your profile" when the optional display name, bio and photo are all empty. */
export function isProfileUnfinished(profile: WelcomeProfile): boolean {
  return !profile.display_name?.trim() && !profile.bio?.trim() && !profile.avatar_url?.trim()
}

export function readWelcomeDismissed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(WELCOME_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeWelcomeDismissed(): void {
  try {
    window.localStorage.setItem(WELCOME_STORAGE_KEY, '1')
  } catch {
    // Private mode or blocked storage: the prompt may reappear this session only.
  }
}

/**
 * PostgREST / Postgres errors when profiles.welcome_dismissed_at is not in the
 * schema yet (code deployed before 0043, or the cache has not reloaded).
 */
export function isWelcomeColumnMissing(error: { code?: string | null; message?: string | null } | null | undefined): boolean {
  if (!error) return false
  if (error.code === '42703' || error.code === 'PGRST204') return true
  const m = (error.message ?? '').toLowerCase()
  return m.includes('welcome_dismissed_at') && (m.includes('does not exist') || m.includes('schema cache') || m.includes('could not find'))
}
