import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/** Current user id + admin flag, memoised per request. */
export const getViewer = cache(async (): Promise<{ userId: string | null; isAdmin: boolean }> => {
  const supabase = await createClient()
  if (!supabase) return { userId: null, isAdmin: false }
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims?.sub ?? null
  if (!userId) return { userId: null, isAdmin: false }
  const { data } = await supabase.rpc('is_admin')
  return { userId, isAdmin: data === true }
})
