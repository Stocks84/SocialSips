import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { isProfileUnfinished, shouldShowWelcome } from '@/lib/welcome'

export type WelcomeState = { show: boolean; showProfile: boolean }

/** Whether this signed-in viewer should be offered the first-visit welcome card. */
export const getWelcomeState = cache(async (): Promise<WelcomeState> => {
  const hidden = { show: false, showProfile: false }
  const { userId, suspended } = await getViewer()
  if (!userId || suspended) return hidden
  const supabase = await createClient()
  if (!supabase) return hidden
  const { data } = await supabase
    .from('profiles')
    .select('created_at, display_name, bio, avatar_url')
    .eq('id', userId)
    .maybeSingle()
  if (!data || !shouldShowWelcome({ createdAt: data.created_at })) return hidden
  return { show: true, showProfile: isProfileUnfinished(data) }
})
