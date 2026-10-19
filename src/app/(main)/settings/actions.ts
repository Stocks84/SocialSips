'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/server/auth'
import { friendlyError, NOT_SAVED } from '@/lib/server/errors'
import { removeImage, uploadImage } from '@/lib/server/uploads'
import { fieldErrors, formValues, type EditState } from '@/lib/validators/issues'
import { profileSchema } from '@/lib/validators/profile'

const fail = (formData: FormData, error: string, fields?: Record<string, string>): EditState =>
  ({ error, fieldErrors: fields, values: formValues(formData) })

/** Saves the signed-in user's display name, bio and avatar. RLS only lets a user update their own row. */
export async function updateProfile(_prev: EditState, formData: FormData): Promise<EditState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth
  const parsed = profileSchema.safeParse({ displayName: String(formData.get('displayName') ?? ''), bio: String(formData.get('bio') ?? '') })
  if (!parsed.success) return fail(formData, 'Display name max 50 characters, bio max 280', fieldErrors(parsed.error.issues))
  const { data: existing } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle()
  if (!existing) return fail(formData, NOT_SAVED)

  const img = await uploadImage(supabase, 'avatars', user.id, formData, 'avatar')
  if ('error' in img) return fail(formData, img.error ?? 'Image upload failed', { avatar: img.error ?? 'Image upload failed' })
  const dropOld = Boolean(img.url) || formData.get('removeAvatar') === 'true'
  const avatarUrl = img.url ?? (dropOld ? null : existing.avatar_url)

  const { data, error } = await supabase.from('profiles')
    .update({ display_name: parsed.data.displayName || null, bio: parsed.data.bio || null, avatar_url: avatarUrl })
    .eq('id', user.id).select('id')
  if (error || !data?.length) {
    await removeImage(supabase, 'avatars', img.url, user.id)
    return fail(formData, error ? friendlyError(error) : NOT_SAVED)
  }
  if (dropOld && existing.avatar_url !== avatarUrl) await removeImage(supabase, 'avatars', existing.avatar_url, user.id)
  revalidatePath(`/profile/${existing.username}`)
  redirect(`/profile/${existing.username}?saved=1`)
}
