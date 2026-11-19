import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { isProfileUnfinished, isWelcomeColumnMissing, shouldShowWelcome } from '@/lib/welcome'

export type WelcomeState = { show: boolean; showProfile: boolean }

const PROFILE_COLS = 'created_at, display_name, bio, avatar_url'
const PROFILE_COLS_WITH_DISMISS = `${PROFILE_COLS}, welcome_dismissed_at`

/** Whether this signed-in viewer should be offered the first-visit welcome card. */
export const getWelcomeState = cache(async (): Promise<WelcomeState> => {
  const hidden = { show: false, showProfile: false }
  const { userId, suspended } = await getViewer()
  if (!userId || suspended) return hidden
  const supabase = await createClient()
  if (!supabase) return hidden
  type WelcomeRow = {
    created_at: string
    display_name: string | null
    bio: string | null
    avatar_url: string | null
    welcome_dismissed_at?: string | null
  }
  const first = await supabase
    .from('profiles')
    .select(PROFILE_COLS_WITH_DISMISS)
    .eq('id', userId)
    .maybeSingle()
  let data: WelcomeRow | null = first.data
  let error = first.error
  if (error && isWelcomeColumnMissing(error)) {
    const retry = await supabase.from('profiles').select(PROFILE_COLS).eq('id', userId).maybeSingle()
    data = retry.data
    error = retry.error
  }
  if (error || !data) {
    if (error) console.error('getWelcomeState', error.code, error.message)
    return hidden
  }
  const dismissed = Boolean(data.welcome_dismissed_at)
  if (!shouldShowWelcome({ createdAt: data.created_at, dismissed })) return hidden
  return { show: true, showProfile: isProfileUnfinished(data) }
})
