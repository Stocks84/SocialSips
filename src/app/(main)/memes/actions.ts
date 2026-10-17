'use server'
import { friendlyError } from '@/lib/server/errors'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser, UUID } from '@/lib/server/auth'
import { removeImage, uploadImage } from '@/lib/server/uploads'
import { memeSchema } from '@/lib/validators/cocktail'

type FormState = { error?: string }

export async function createMeme(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth
  const parsed = memeSchema.safeParse({
    caption: String(formData.get('caption') ?? '').trim() || undefined,
    jokeText: String(formData.get('jokeText') ?? '').trim() || undefined,
  })
  if (!parsed.success) return { error: 'Caption max 200 characters, joke max 500' }
  const img = await uploadImage(supabase, 'memes', user.id, formData, 'image')
  if ('error' in img) return { error: img.error }
  if (!img.url && !parsed.data.jokeText) return { error: 'Add an image or a joke' }
  const { error } = await supabase.from('memes').insert({
    author_id: user.id, caption: parsed.data.caption ?? null, joke_text: parsed.data.jokeText ?? null, image_url: img.url,
  })
  if (error) {
    await removeImage(supabase, 'memes', img.url)
    return { error: friendlyError(error) }
  }
  revalidatePath('/memes')
  redirect('/memes')
}

export async function deleteMeme(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return
  const { supabase, user } = auth
  const id = String(formData.get('memeId'))
  if (!UUID.test(id)) return
  const { data } = await supabase.from('memes').select('author_id, image_url').eq('id', id).maybeSingle()
  if (!data || data.author_id !== user.id) return
  const { error } = await supabase.from('memes').delete().eq('id', id).eq('author_id', user.id)
  if (!error) await removeImage(supabase, 'memes', data.image_url)
  revalidatePath('/memes')
}

export async function updateMeme(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth
  const id = String(formData.get('memeId'))
  if (!UUID.test(id)) return { error: 'Unknown meme' }
  const { data: existing } = await supabase.from('memes').select('author_id, image_url').eq('id', id).maybeSingle()
  if (!existing || existing.author_id !== user.id) return { error: 'You can only edit your own memes.' }
  const parsed = memeSchema.safeParse({
    caption: String(formData.get('caption') ?? '').trim() || undefined,
    jokeText: String(formData.get('jokeText') ?? '').trim() || undefined,
  })
  if (!parsed.success) return { error: 'Caption max 200 characters, joke max 500' }
  const img = await uploadImage(supabase, 'memes', user.id, formData, 'image')
  if ('error' in img) return { error: img.error }
  const imageUrl = img.url ?? existing.image_url
  if (!imageUrl && !parsed.data.jokeText) return { error: 'Keep an image or add a joke' }
  const { data, error } = await supabase
    .from('memes')
    .update({ caption: parsed.data.caption ?? null, joke_text: parsed.data.jokeText ?? null, image_url: imageUrl })
    .eq('id', id)
    .eq('author_id', user.id)
    .select('id')
  if (error || !data?.length) {
    await removeImage(supabase, 'memes', img.url)
    return { error: error ? friendlyError(error) : 'Could not save your changes.' }
  }
  if (img.url) await removeImage(supabase, 'memes', existing.image_url)
  revalidatePath('/memes')
  redirect('/memes')
}
