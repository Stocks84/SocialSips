import 'server-only'
import { createClient } from '@/lib/supabase/server'

/** Signed-in Supabase client + user, or an error. All writes go through RLS as this user. */
export async function requireUser() {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured.' } as const
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in first.' } as const
  return { supabase, user } as const
}

/** Same, but also requires profiles.is_admin. */
export async function requireAdmin() {
  const auth = await requireUser()
  if ('error' in auth) return auth
  const { data } = await auth.supabase.from('profiles').select('is_admin').eq('id', auth.user.id).maybeSingle()
  if (!data?.is_admin) return { error: 'Admins only.' } as const
  return auth
}

export const UUID = /^[0-9a-f-]{36}$/i
