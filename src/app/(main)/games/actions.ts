'use server'
import { friendlyError, NOT_SAVED } from '@/lib/server/errors'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireUser, UUID } from '@/lib/server/auth'
import { removeImage, uploadImage } from '@/lib/server/uploads'
import { fieldErrors, firstIssue, formValues, type EditState } from '@/lib/validators/issues'
import { gameSchema, splitList, variationSchema } from '@/lib/validators/game'
import { commentSchema, ratingSchema, reportSchema } from '@/lib/validators/comment'

export type FormState = EditState

/** Failed submit: message + per-field errors + the typed values so the form keeps them. */
const fail = (formData: FormData, error: string, fields?: Record<string, string>): FormState =>
  ({ error, fieldErrors: fields, values: formValues(formData) })

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
    .from('games').select('author_id, cover_image_url').eq('id', gameId).maybeSingle()
  if (!existing || existing.author_id !== user.id) return fail(formData, 'You can only edit your own games.')

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

// ─── Comments & ratings (games or cocktails) ────────────────────────────────

type Kind = 'game' | 'cocktail'
const target = (formData: FormData) => {
  const kind: Kind = formData.get('kind') === 'cocktail' ? 'cocktail' : 'game'
  const id = String(formData.get('targetId') ?? '')
  return { kind, id, column: kind === 'game' ? 'game_id' : 'cocktail_id', path: `/${kind === 'game' ? 'games' : 'cocktails'}/${id}` } as const
}

/** Comments can also hang off memes (no ratings/variations there). */
const commentTarget = (formData: FormData) => {
  if (formData.get('kind') !== 'meme') return target(formData)
  const id = String(formData.get('targetId') ?? '')
  return { kind: 'meme', id, column: 'meme_id', path: `/memes/${id}` } as const
}

export async function addComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const t = commentTarget(formData)
  if (!UUID.test(t.id)) return { error: 'Unknown item' }
  const parsed = commentSchema.safeParse({ body: String(formData.get('body') ?? '').trim() })
  if (!parsed.success) return fail(formData, 'Write something first (max 1000 characters)', { body: 'Write 1–1000 characters' })
  const { error } = await auth.supabase.from('comments').insert({ author_id: auth.user.id, [t.column]: t.id, body: parsed.data.body })
  if (error) return fail(formData, friendlyError(error))
  revalidatePath(t.path)
  return { ok: true }
}

export async function deleteComment(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return
  const t = commentTarget(formData)
  const commentId = String(formData.get('commentId'))
  if (!UUID.test(commentId) || !UUID.test(t.id)) return
  // RLS only allows deleting your own; the author filter is belt and braces.
  await auth.supabase.from('comments').delete().eq('id', commentId).eq('author_id', auth.user.id)
  revalidatePath(t.path)
}

export async function rate(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return
  const t = target(formData)
  const parsed = ratingSchema.safeParse({ score: formData.get('score') })
  if (!parsed.success || !UUID.test(t.id)) {
    console.error('rate: invalid input', t.id, formData.get('score'))
    return
  }
  const { error } = await auth.supabase
    .from('ratings')
    .upsert({ user_id: auth.user.id, [t.column]: t.id, score: parsed.data.score }, { onConflict: `user_id,${t.column}` })
  if (error) console.error('rate', error.message)
  revalidatePath(t.path)
  revalidatePath('/feed')
}

// ─── Variations (games or cocktails) ────────────────────────────────────────

const variationTarget = (formData: FormData) => {
  const t = target(formData)
  return { ...t, table: t.kind === 'game' ? 'game_variations' : 'cocktail_variations' } as const
}

export async function addVariation(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const t = variationTarget(formData)
  if (!UUID.test(t.id)) return { error: 'Unknown item' }
  const parsed = variationSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    rules: String(formData.get('rules') ?? '').trim(),
  })
  if (!parsed.success) return fail(formData, 'Give your variation a name (3–80 chars) and details (10–3000 chars)', fieldErrors(parsed.error.issues))
  const { error } = await auth.supabase.from(t.table).insert({ [t.column]: t.id, author_id: auth.user.id, ...parsed.data })
  if (error) return fail(formData, friendlyError(error))
  revalidatePath(t.path)
  return { ok: true }
}

export async function deleteVariation(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return
  const t = variationTarget(formData)
  const variationId = String(formData.get('variationId'))
  if (!UUID.test(variationId) || !UUID.test(t.id)) return
  await auth.supabase.from(t.table).delete().eq('id', variationId).eq('author_id', auth.user.id)
  revalidatePath(t.path)
}

// ─── Reports ────────────────────────────────────────────────────────────────

export async function reportContent(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const parsed = reportSchema.safeParse({
    targetType: formData.get('targetType'),
    targetId: formData.get('targetId'),
    reason: formData.get('reason'),
    note: String(formData.get('note') ?? '').trim() || undefined,
  })
  if (!parsed.success) return { error: 'Pick a reason' }
  const r = parsed.data
  const { error } = await auth.supabase.from('reports').insert({
    reporter_id: auth.user.id, target_type: r.targetType, target_id: r.targetId, reason: r.reason, note: r.note ?? null,
  })
  if (error && error.code !== '23505') return { error: friendlyError(error) } // 23505 = already reported → fine
  return { ok: true }
}
