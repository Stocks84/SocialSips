import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/** Current user id + admin flag, memoised per request. */
export const getViewer = cache(async () => {
  const supabase = await createClient()
  if (!supabase) return { userId: null, isAdmin: false }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { userId: null, isAdmin: false }
  const { data } = await supabase.rpc('is_admin')
  return { userId: user.id, isAdmin: data === true }
})
