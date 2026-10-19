'use server'
import { revalidatePath } from 'next/cache'
import { requireUser, UUID } from '@/lib/server/auth'
import { friendlyError } from '@/lib/server/errors'
import { isReaction } from '@/lib/memes'

/** Set, change or (emoji = null) remove the viewer's reaction on a meme. */
export async function setReaction(memeId: string, emoji: string | null): Promise<{ error?: string }> {
  const auth = await requireUser()
  if ('error' in auth) return { error: 'Sign in to react.' }
  if (!UUID.test(memeId)) return { error: 'Unknown meme' }
  const { supabase, user } = auth
  if (emoji === null) {
    const { error } = await supabase.from('meme_reactions').delete().eq('meme_id', memeId).eq('user_id', user.id)
    if (error) return { error: friendlyError(error, 'reaction') }
  } else {
    if (!isReaction(emoji)) return { error: 'Pick one of the reactions' }
    // Change an existing reaction, else add one (users may only update the emoji column, so no upsert).
    const { data: changed, error: updErr } = await supabase.from('meme_reactions')
      .update({ emoji }).eq('meme_id', memeId).eq('user_id', user.id).select('meme_id')
    if (updErr) return { error: friendlyError(updErr, 'reaction') }
    if (!changed?.length) {
      const { error } = await supabase.from('meme_reactions').insert({ meme_id: memeId, user_id: user.id, emoji })
      if (error) return { error: friendlyError(error, 'reaction') }
    }
  }
  revalidatePath(`/memes/${memeId}`)
  return {}
}
