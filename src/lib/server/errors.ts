import 'server-only'

type DbError = { message?: string; code?: string; hint?: string | null } | null | undefined

/** Maps a Supabase/Postgres error to a user-safe message (no schema details). Logs the original. */
export function friendlyError(error: DbError, context = 'db'): string {
  if (!error) return 'Something went wrong. Please try again.'
  console.error(context, error.code, error.message)
  if (error.hint === 'rate_limit' || error.message?.startsWith('Slow down')) return error.message ?? 'Slow down a bit 🍹'
  switch (error.code) {
    case '23514': return 'Something in the form is too long or not allowed.'
    case '23505': return 'That already exists.'
    case '42501': return 'You can’t do that (the item may be hidden or not yours).'
    case '23503': return 'That item no longer exists.'
    default: return 'Something went wrong. Please try again.'
  }
}
