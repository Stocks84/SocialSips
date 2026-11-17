import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type Suspension = { reason: string | null }

/** Current user id + admin flag + suspension (null = not suspended), memoised per request. */
export const getViewer = cache(async (): Promise<{ userId: string | null; isAdmin: boolean; suspended: Suspension | null }> => {
  const supabase = await createClient()
  if (!supabase) return { userId: null, isAdmin: false, suspended: null }
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims?.sub ?? null
  if (!userId) return { userId: null, isAdmin: false, suspended: null }
  const [{ data }, { data: susp }] = await Promise.all([supabase.rpc('is_admin'), supabase.rpc('my_suspension')])
  const row = Array.isArray(susp) ? susp[0] : null
  return { userId, isAdmin: data === true, suspended: row ? { reason: row.reason ?? null } : null }
})
