'use server'
import { friendlyError, HIDDEN_LOCKED, NOT_SAVED } from '@/lib/server/errors'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireUser, UUID } from '@/lib/server/auth'
import { removeImage, uploadImage } from '@/lib/server/uploads'
import { fail, type FormState } from '@/lib/server/forms'
import { fieldErrors, firstIssue } from '@/lib/validators/issues'
import { gameSchema, splitList } from '@/lib/validators/game'

export type { FormState }

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'game'

function parseGame(formData: FormData) {
  return gameSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    summary: String(formData.get('summary') ?? '').trim(),
    rules: String(formData.get('rules') ?? '').trim(),
    equipment: splitList(formData.get('equipment')),
    minPlayers: formData.get('minPlayers') || 2,
    maxPlayers: formData.get('maxPlayers') || undefined,
    hangoverRating: formData.get('hangoverRating'),
    tags: splitList(formData.get('tags'), true),
  })
}

const uploadCover = (supabase: SupabaseClient, userId: string, formData: FormData) =>
  uploadImage(supabase, 'game-covers', userId, formData)
const removeCover = (supabase: SupabaseClient, url: string | null) => removeImage(supabase, 'game-covers', url)


// ─── Games ──────────────────────────────────────────────────────────────────

export async function createGame(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth
  const parsed = parseGame(formData)
  if (!parsed.success) return fail(formData, firstIssue(parsed.error.issues), fieldErrors(parsed.error.issues))
  const g = parsed.data

  const cover = await uploadCover(supabase, user.id, formData)
  if ('error' in cover) return fail(formData, cover.error ?? 'Image upload failed', { cover: cover.error ?? 'Image upload failed' })

  const { data, error } = await supabase
    .from('games')
    .insert({
      author_id: user.id,
      title: g.title,
      slug: `${slugify(g.title)}-${crypto.randomUUID().slice(0, 6)}`,
      summary: g.summary,
      rules: g.rules,
      equipment: g.equipment,
      min_players: g.minPlayers,
      max_players: g.maxPlayers ?? null,
      hangover_rating: g.hangoverRating,
      tags: g.tags,
      cover_image_url: cover.url,
    })
    .select('id')
    .single()
  if (error) {
    await removeCover(supabase, cover.url)
    return fail(formData, friendlyError(error))
  }
  revalidatePath('/feed')
  redirect(`/games/${data.id}`)
}

export async function updateGame(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth
  const gameId = String(formData.get('gameId'))
  if (!UUID.test(gameId)) return { error: 'Unknown game' }

  const { data: existing } = await supabase
    .from('games').select('author_id, cover_image_url, is_hidden').eq('id', gameId).maybeSingle()
  if (!existing || existing.author_id !== user.id) return fail(formData, 'You can only edit your own games.')
  if (existing.is_hidden) return fail(formData, HIDDEN_LOCKED)

  const parsed = parseGame(formData)
  if (!parsed.success) return fail(formData, firstIssue(parsed.error.issues), fieldErrors(parsed.error.issues))
  const g = parsed.data

  const cover = await uploadCover(supabase, user.id, formData)
  if ('error' in cover) return fail(formData, cover.error ?? 'Image upload failed', { cover: cover.error ?? 'Image upload failed' })
  const dropOld = Boolean(cover.url) || formData.get('removeCover') === 'true'
  const coverUrl = cover.url ?? (dropOld ? null : existing.cover_image_url)

  const { data: saved, error } = await supabase
    .from('games')
    .update({
      title: g.title,
      summary: g.summary,
      rules: g.rules,
      equipment: g.equipment,
      min_players: g.minPlayers,
      max_players: g.maxPlayers ?? null,
      hangover_rating: g.hangoverRating,
      tags: g.tags,
      cover_image_url: coverUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId)
    .eq('author_id', user.id)
    .select('id')
  if (error || !saved?.length) {
    await removeCover(supabase, cover.url)
    return fail(formData, error ? friendlyError(error) : NOT_SAVED)
  }
  if (dropOld) await removeCover(supabase, existing.cover_image_url)

  revalidatePath('/feed')
  revalidatePath(`/games/${gameId}`)
  redirect(`/games/${gameId}?saved=1`)
}

export async function deleteGame(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return
  const { supabase, user } = auth
  const gameId = String(formData.get('gameId'))
  if (!UUID.test(gameId)) return
  const { data: existing } = await supabase
    .from('games').select('author_id, cover_image_url').eq('id', gameId).maybeSingle()
  if (!existing || existing.author_id !== user.id) return
  const { error } = await supabase.from('games').delete().eq('id', gameId).eq('author_id', user.id)
  if (error) return
  await removeCover(supabase, existing.cover_image_url)
  revalidatePath('/feed')
  redirect('/feed')
}
