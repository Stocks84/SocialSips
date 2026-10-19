import 'server-only'

type DbError = { message?: string; code?: string; hint?: string | null; details?: string | null } | null | undefined

/** Maps a Supabase/Postgres error to a user-safe message (no schema details). Logs the original. */
export function friendlyError(error: DbError, context = 'db'): string {
  if (!error) return 'Something went wrong. Please try again.'
  console.error(context, error.code, error.message)
  const msg = error.message ?? ''
  if (error.hint === 'rate_limit' || msg.startsWith('Slow down')) return msg || 'Slow down a bit 🍹'
  if (msg.includes('Only admins can hide or unhide')) return 'Only moderators can hide or unhide posts.'
  if (/fetch failed|network|ECONN|ETIMEDOUT|timeout/i.test(msg)) return 'We couldn’t reach the server. Check your connection and try again.'
  if (/row-level security/i.test(msg)) return 'You can’t do this here. It may not be yours, it may have been hidden or removed, or the author isn’t accepting comments from you.'
  switch (error.code) {
    case '23514': {
      if (msg.includes('memes_check')) return 'Add an image or a joke.'
      if (/_image_url|_cover_url|avatar_url/.test(msg)) return 'That image isn’t allowed. Upload it again from your device.'
      if (msg.includes('games_check')) return 'Max players must be at least min players.'
      if (/_len|_check/.test(msg)) return 'Something in the form is too long or too short. Check the limits and try again.'
      return 'Something in the form isn’t allowed. Check it and try again.'
    }
    case '22001': return 'Something in the form is too long.'
    case '22P02': return 'Something in the form isn’t in the right format.'
    case '23505': return 'That already exists.'
    case '42501': return 'You can’t do that. The item may be hidden or not yours.'
    case '23503': return 'That item no longer exists.'
    case 'PGRST116': return 'We couldn’t find that item. It may have been removed.'
    default: return 'Something went wrong on our side. Please try again.'
  }
}

/** Shown when an update matched no rows (removed, or RLS filtered it out). */
export const NOT_SAVED = 'We couldn’t save your changes. The item may have been removed, or it’s not yours.'
export const HIDDEN_LOCKED = 'A moderator has hidden this post, so it can’t be edited right now.'
