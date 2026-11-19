'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { isWelcomeColumnMissing } from '@/lib/welcome'

/**
 * Record a welcome-prompt dismiss on the signed-in user's own profile.
 * Only writes welcome_dismissed_at (RLS + column grants block any other change).
 * No-ops if signed out, suspended, or the column is not in the schema yet.
 */
export async function dismissWelcome(): Promise<void> {
  const { userId, suspended } = await getViewer()
  if (!userId || suspended) return
  const supabase = await createClient()
  if (!supabase) return
  const { error } = await supabase
    .from('profiles')
    .update({ welcome_dismissed_at: new Date().toISOString() })
    .eq('id', userId)
  if (error && !isWelcomeColumnMissing(error)) {
    console.error('dismissWelcome', error.code, error.message)
    return
  }
  if (!error) revalidatePath('/', 'layout')
}
