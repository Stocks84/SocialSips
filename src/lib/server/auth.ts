import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { SUSPENDED_MESSAGE } from '@/lib/server/errors'

/** Signed-in Supabase client + user, or an error. All writes go through RLS as this user. */
export async function requireUser() {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured.' } as const
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in first.' } as const
  return { supabase, user } as const
}

/**
 * Signed-in user who is NOT suspended: use for anything that creates, edits or reacts.
 * (Deleting your own posts, withdrawing, blocking and deleting your account stay on requireUser.)
 * The database enforces the same rule (migration 0040), this just gives a clear message first.
 * `suspended: true` in the error result lets callers tell "suspended" apart from "not signed in".
 */
export async function requireActiveUser() {
  const auth = await requireUser()
  if ('error' in auth) return auth
  const { data } = await auth.supabase.rpc('my_suspension')
  if (Array.isArray(data) && data.length > 0) return { error: SUSPENDED_MESSAGE, suspended: true } as const
  return auth
}

/** Same as requireUser, but also requires profiles.is_admin. */
export async function requireAdmin() {
  const auth = await requireUser()
  if ('error' in auth) return auth
  // is_admin() is SECURITY DEFINER: profiles.is_admin is not readable by the API roles.
  const { data } = await auth.supabase.rpc('is_admin')
  if (data !== true) return { error: 'Admins only.' } as const
  return auth
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
