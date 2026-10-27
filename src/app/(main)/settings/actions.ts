'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { requireUser, UUID } from '@/lib/server/auth'
import { friendlyError, NOT_SAVED } from '@/lib/server/errors'
import { removeImage, uploadImage } from '@/lib/server/uploads'
import { fail, type EditState } from '@/lib/server/forms'
import { fieldErrors } from '@/lib/validators/issues'
import { profileSchema } from '@/lib/validators/profile'

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

// ─── Blocking ────────────────────────────────────────────────────────────────

/** Block / unblock another user by id. RLS: only your own block rows. */
export async function setBlock(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return
  const target = String(formData.get('userId') ?? '')
  const back = String(formData.get('back') ?? '')
  if (!UUID.test(target) || target === auth.user.id) return
  if (formData.get('block') === '1') {
    const { error } = await auth.supabase.from('blocks').insert({ blocker_id: auth.user.id, blocked_id: target })
    if (error && error.code !== '23505') console.error('block', error.message)
  } else {
    await auth.supabase.from('blocks').delete().eq('blocker_id', auth.user.id).eq('blocked_id', target)
  }
  revalidatePath('/', 'layout')
  if (back.startsWith('/') && !back.startsWith('//')) redirect(back)
}

// ─── Delete account ──────────────────────────────────────────────────────────

const BUCKETS = ['avatars', 'game-covers', 'memes', 'cocktails'] as const

/** Deletes the signed-in user's files, content and login. Needs the username typed as confirmation. */
export async function deleteAccount(_prev: EditState, formData: FormData): Promise<EditState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth
  const { data: me } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
  if (!me) return { error: NOT_SAVED }
  if (String(formData.get('confirm') ?? '').trim().toLowerCase() !== me.username) {
    return { error: `Type your username (${me.username}) to confirm.`, fieldErrors: { confirm: 'Doesn’t match your username' } }
  }
  if (formData.get('understand') !== 'true') return { error: 'Please tick the box to confirm.' }
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin === true) return { error: 'Admin accounts can’t be deleted here. Remove admin rights first.' }

  // 1. Storage files in the user's own folders (owner policies allow list + remove).
  for (const bucket of BUCKETS) {
    for (let round = 0; round < 20; round++) {
      const { data: files, error } = await supabase.storage.from(bucket).list(user.id, { limit: 100 })
      if (error) { console.error('delete account: list', bucket, error.message); return { error: 'We couldn’t delete your files. Please try again.' } }
      if (!files?.length) break
      const { error: rmErr } = await supabase.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`))
      if (rmErr) { console.error('delete account: remove', bucket, rmErr.message); return { error: 'We couldn’t delete your files. Please try again.' } }
      if (files.length < 100) break
    }
  }
  // 2. Content + login (SECURITY DEFINER; refuses admins).
  const { error } = await supabase.rpc('delete_my_account')
  if (error) {
    console.error('delete_my_account', error.code, error.message)
    return { error: error.message.includes('admin_account') ? 'Admin accounts can’t be deleted here.' : 'We couldn’t delete your account. Please try again or email us.' }
  }
  await supabase.auth.signOut().catch(() => {})
  const jar = await cookies()
  for (const c of jar.getAll()) if (c.name.startsWith('sb-')) jar.delete(c.name)
  redirect('/?deleted=1')
}

// ─── Follows ─────────────────────────────────────────────────────────────────

/** Follow / unfollow. RLS refuses following yourself or anyone in a block with you; a trigger rate-limits. */
export async function setFollow(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) redirect('/sign-in')
  const target = String(formData.get('userId') ?? '')
  const back = String(formData.get('back') ?? '')
  const safeBack = back.startsWith('/') && !back.startsWith('//') ? back : '/feed'
  if (!UUID.test(target) || target === auth.user.id) redirect(safeBack)
  let err = ''
  if (formData.get('follow') === '1') {
    const { error } = await auth.supabase.from('follows').insert({ follower_id: auth.user.id, followee_id: target })
    if (error && error.code !== '23505') err = error.hint === 'rate_limit' || error.message.startsWith('Slow down') || error.message.startsWith('You can follow') ? error.message : 'You can’t follow this person.'
  } else {
    await auth.supabase.from('follows').delete().eq('follower_id', auth.user.id).eq('followee_id', target)
  }
  revalidatePath(safeBack)
  redirect(err ? `${safeBack}?followError=${encodeURIComponent(err)}` : safeBack)
}
