'use server'
import { friendlyError, HIDDEN_LOCKED, NOT_SAVED } from '@/lib/server/errors'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser, UUID } from '@/lib/server/auth'
import { removeImage, uploadImage } from '@/lib/server/uploads'
import { cocktailSchema } from '@/lib/validators/cocktail'
import { fail, type FormState } from '@/lib/server/forms'
import { fieldErrors, firstIssue } from '@/lib/validators/issues'

function parseCocktail(formData: FormData) {
  const amounts = formData.getAll('ingredientAmount').map(String)
  const items = formData.getAll('ingredientItem').map(String)
  const ingredients = items
    .map((item, i) => ({ item: item.trim(), amount: (amounts[i] ?? '').trim() }))
    .filter((x) => x.item)
  return cocktailSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    ingredients,
    method: String(formData.get('method') ?? '').trim(),
    isAlcoholFree: formData.get('isAlcoholFree') === 'true',
  })
}

export async function createCocktail(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth
  const parsed = parseCocktail(formData)
  if (!parsed.success) return fail(formData, firstIssue(parsed.error.issues), fieldErrors(parsed.error.issues))
  const c = parsed.data
  const img = await uploadImage(supabase, 'cocktails', user.id, formData)
  if ('error' in img) return fail(formData, img.error ?? 'Image upload failed', { cover: img.error ?? 'Image upload failed' })
  const { data, error } = await supabase
    .from('cocktails')
    .insert({
      author_id: user.id, name: c.name, description: c.description, ingredients: c.ingredients,
      method: c.method, is_alcohol_free: c.isAlcoholFree, image_url: img.url,
    })
    .select('id')
    .single()
  if (error) {
    await removeImage(supabase, 'cocktails', img.url)
    return fail(formData, friendlyError(error))
  }
  revalidatePath('/cocktails')
  redirect(`/cocktails/${data.id}`)
}

export async function updateCocktail(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth
  const id = String(formData.get('cocktailId'))
  if (!UUID.test(id)) return { error: 'Unknown cocktail' }
  const { data: existing } = await supabase.from('cocktails').select('author_id, image_url, is_hidden').eq('id', id).maybeSingle()
  if (!existing || existing.author_id !== user.id) return fail(formData, 'You can only edit your own cocktails.')
  if (existing.is_hidden) return fail(formData, HIDDEN_LOCKED)
  const parsed = parseCocktail(formData)
  if (!parsed.success) return fail(formData, firstIssue(parsed.error.issues), fieldErrors(parsed.error.issues))
  const c = parsed.data
  const img = await uploadImage(supabase, 'cocktails', user.id, formData)
  if ('error' in img) return fail(formData, img.error ?? 'Image upload failed', { cover: img.error ?? 'Image upload failed' })
  const dropOld = Boolean(img.url) || formData.get('removeCover') === 'true'
  const { data: saved, error } = await supabase
    .from('cocktails')
    .update({
      name: c.name, description: c.description, ingredients: c.ingredients, method: c.method,
      is_alcohol_free: c.isAlcoholFree, image_url: img.url ?? (dropOld ? null : existing.image_url),
    })
    .eq('id', id)
    .eq('author_id', user.id)
    .select('id')
  if (error || !saved?.length) {
    await removeImage(supabase, 'cocktails', img.url)
    return fail(formData, error ? friendlyError(error) : NOT_SAVED)
  }
  if (dropOld) await removeImage(supabase, 'cocktails', existing.image_url)
  revalidatePath('/cocktails')
  revalidatePath(`/cocktails/${id}`)
  redirect(`/cocktails/${id}?saved=1`)
}

export async function deleteCocktail(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return
  const { supabase, user } = auth
  const id = String(formData.get('cocktailId'))
  if (!UUID.test(id)) return
  const { data: existing } = await supabase.from('cocktails').select('author_id, image_url').eq('id', id).maybeSingle()
  if (!existing || existing.author_id !== user.id) return
  const { error } = await supabase.from('cocktails').delete().eq('id', id).eq('author_id', user.id)
  if (error) return
  await removeImage(supabase, 'cocktails', existing.image_url)
  revalidatePath('/cocktails')
  redirect('/cocktails')
}
