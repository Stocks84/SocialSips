'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser, UUID } from '@/lib/server/auth'
import { friendlyError } from '@/lib/server/errors'

const MSG: Record<string, string> = {
  challenge_closed: 'This challenge is closed.',
  already_entered: 'You’ve already entered this challenge.',
  not_your_submission: 'You can only enter your own (visible) submission.',
  own_entry: 'You can’t vote for your own entry.',
  blocked: 'You can’t vote for this entry.',
  entry_not_found: 'That entry isn’t available any more.',
  challenge_not_found: 'That challenge doesn’t exist.',
}
const back = (formData: FormData, err?: string) => {
  const id = String(formData.get('challengeId') ?? '')
  const path = formData.get('current') === '1' ? '/challenge' : `/challenge/${id}`
  revalidatePath('/challenge', 'layout')
  redirect(err ? `${path}?error=${encodeURIComponent(err)}` : `${path}#entries`)
}
const explain = (e: { message?: string; code?: string; hint?: string | null }) => MSG[e.message ?? ''] ?? friendlyError(e, 'challenge')

export async function enterChallenge(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) redirect('/sign-in?redirectTo=/challenge')
  const challengeId = String(formData.get('challengeId') ?? ''), submission = String(formData.get('submissionId') ?? '')
  if (!UUID.test(challengeId) || !UUID.test(submission)) back(formData, 'Pick one of your submissions.')
  const { error } = await auth.supabase.rpc('enter_challenge', { p_challenge: challengeId, p_submission: submission })
  back(formData, error ? explain(error) : undefined)
}

export async function withdrawEntry(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) redirect('/sign-in?redirectTo=/challenge')
  const challengeId = String(formData.get('challengeId') ?? '')
  if (!UUID.test(challengeId)) back(formData)
  const { error } = await auth.supabase.rpc('withdraw_challenge_entry', { p_challenge: challengeId })
  back(formData, error ? explain(error) : undefined)
}

export async function voteChallenge(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) redirect('/sign-in?redirectTo=/challenge')
  const challengeId = String(formData.get('challengeId') ?? ''), entry = String(formData.get('entryId') ?? '')
  if (!UUID.test(challengeId) || (entry && !UUID.test(entry))) back(formData)
  const { error } = await auth.supabase.rpc('set_challenge_vote', { p_challenge: challengeId, p_entry: entry || null })
  back(formData, error ? explain(error) : undefined)
}
