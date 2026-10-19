'use server'
import { friendlyError, HIDDEN_LOCKED, NOT_SAVED } from '@/lib/server/errors'
import { fieldErrors, formValues, type EditState } from '@/lib/validators/issues'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser, UUID } from '@/lib/server/auth'
import { removeImage, uploadImage } from '@/lib/server/uploads'
import { memeSchema } from '@/lib/validators/cocktail'

type FormState = EditState
const fail = (formData: FormData, error: string, fields?: Record<string, string>): FormState =>
  ({ error, fieldErrors: fields, values: formValues(formData) })

export async function createMeme(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth
  const parsed = memeSchema.safeParse({
    caption: String(formData.get('caption') ?? '').trim() || undefined,
    jokeText: String(formData.get('jokeText') ?? '').trim() || undefined,
  })
  if (!parsed.success) return fail(formData, 'Caption max 200 characters, joke max 500', fieldErrors(parsed.error.issues))
  const img = await uploadImage(supabase, 'memes', user.id, formData, 'image')
  if ('error' in img) return fail(formData, img.error ?? 'Image upload failed', { image: img.error ?? 'Image upload failed' })
  if (!img.url && !parsed.data.jokeText) return fail(formData, 'Add an image or a joke', { image: 'Add an image or a joke' })
  const { error } = await supabase.from('memes').insert({
    author_id: user.id, caption: parsed.data.caption ?? null, joke_text: parsed.data.jokeText ?? null, image_url: img.url,
  })
  if (error) {
    await removeImage(supabase, 'memes', img.url)
    return fail(formData, friendlyError(error))
  }
  revalidatePath('/memes')
  redirect('/memes')
}

/** Delete-result codes shown as a banner on /memes (codes, not free text, so the URL can't inject messages). */
export type DeleteResult = 'deleted' | 'signin' | 'gone' | 'notyours' | 'failed'

export async function deleteMeme(formData: FormData) {
  const back = (r: DeleteResult): never => redirect(`/memes?deleted=${r}`)
  const auth = await requireUser()
  if ('error' in auth) return back('signin')
  const { supabase, user } = auth
  const id = String(formData.get('memeId'))
  if (!UUID.test(id)) return back('gone')
  const { data } = await supabase.from('memes').select('author_id, image_url').eq('id', id).maybeSingle()
  if (!data) return back('gone')
  if (data.author_id !== user.id) back('notyours')
  const { data: gone, error } = await supabase.from('memes').delete().eq('id', id).eq('author_id', user.id).select('id')
  if (error || !gone?.length) {
    if (error) friendlyError(error, 'deleteMeme') // logs the original
    back('failed')
  }
  await removeImage(supabase, 'memes', data.image_url)
  revalidatePath('/memes')
  back('deleted')
}

export async function updateMeme(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth
  const id = String(formData.get('memeId'))
  if (!UUID.test(id)) return { error: 'Unknown meme' }
  const { data: existing } = await supabase.from('memes').select('author_id, image_url, is_hidden').eq('id', id).maybeSingle()
  if (!existing || existing.author_id !== user.id) return fail(formData, 'You can only edit your own memes.')
  if (existing.is_hidden) return fail(formData, HIDDEN_LOCKED)
  const parsed = memeSchema.safeParse({
    caption: String(formData.get('caption') ?? '').trim() || undefined,
    jokeText: String(formData.get('jokeText') ?? '').trim() || undefined,
  })
  if (!parsed.success) return fail(formData, 'Caption max 200 characters, joke max 500', fieldErrors(parsed.error.issues))
  const img = await uploadImage(supabase, 'memes', user.id, formData, 'image')
  if ('error' in img) return fail(formData, img.error ?? 'Image upload failed', { image: img.error ?? 'Image upload failed' })
  const dropOld = Boolean(img.url) || formData.get('removeImage') === 'true'
  const imageUrl = img.url ?? (dropOld ? null : existing.image_url)
  if (!imageUrl && !parsed.data.jokeText) return fail(formData, 'Keep an image or add a joke', { jokeText: 'Keep an image or add a joke' })
  const { data, error } = await supabase
    .from('memes')
    .update({ caption: parsed.data.caption ?? null, joke_text: parsed.data.jokeText ?? null, image_url: imageUrl })
    .eq('id', id)
    .eq('author_id', user.id)
    .select('id')
  if (error || !data?.length) {
    await removeImage(supabase, 'memes', img.url)
    return fail(formData, error ? friendlyError(error) : NOT_SAVED)
  }
  if (dropOld) await removeImage(supabase, 'memes', existing.image_url)
  revalidatePath('/memes')
  revalidatePath(`/memes/${id}`)
  redirect(`/memes/${id}?saved=1`)
}
