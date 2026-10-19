'use server'
import { revalidatePath } from 'next/cache'
import { requireUser, UUID } from '@/lib/server/auth'
import { friendlyError } from '@/lib/server/errors'
import { isReaction } from '@/lib/memes'

export type ReactionResult = { error?: string; counts?: Record<string, number>; mine?: string | null }

/** Set, change or (emoji = null) remove the viewer's reaction on a meme. One atomic DB call; returns the fresh counts. */
export async function setReaction(memeId: string, emoji: string | null): Promise<ReactionResult> {
  const auth = await requireUser()
  if ('error' in auth) return { error: 'Sign in to react.' }
  if (!UUID.test(memeId)) return { error: 'Unknown meme' }
  if (emoji !== null && !isReaction(emoji)) return { error: 'Pick one of the reactions' }
  const { data, error } = await auth.supabase.rpc('set_reaction', { p_meme: memeId, p_emoji: emoji })
  if (error) return { error: friendlyError(error, 'reaction') }
  const res = (data ?? {}) as { counts?: Record<string, number>; mine?: string | null }
  revalidatePath(`/memes/${memeId}`)
  return { counts: res.counts ?? {}, mine: res.mine ?? null }
}
