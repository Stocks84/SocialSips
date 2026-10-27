'use server'
import { friendlyError, HIDDEN_LOCKED, NOT_SAVED } from '@/lib/server/errors'
import { revalidatePath } from 'next/cache'
import { requireUser, UUID } from '@/lib/server/auth'
import { fail, type FormState } from '@/lib/server/forms'
import { fieldErrors } from '@/lib/validators/issues'
import { variationSchema } from '@/lib/validators/game'
import { commentSchema, ratingSchema, reportSchema } from '@/lib/validators/comment'

export type { FormState }

// ─── Comments & ratings (game or cocktails) ────────────────────────────────

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
  return { kind: 'meme' as const, id, column: 'meme_id' as const, path: `/memes/${id}` }
}

export async function addComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const t = commentTarget(formData)
  if (!UUID.test(t.id)) return { error: 'Unknown item' }
  const parsed = commentSchema.safeParse({ body: String(formData.get('body') ?? '').trim() })
  if (!parsed.success) return fail(formData, 'Write something first (max 1000 characters)', { body: 'Write 1–1000 characters' })
  const body = parsed.data.body
  const { error } =
    t.column === 'game_id' ? await auth.supabase.from('comments').insert({ author_id: auth.user.id, body, game_id: t.id })
    : t.column === 'cocktail_id' ? await auth.supabase.from('comments').insert({ author_id: auth.user.id, body, cocktail_id: t.id })
    : await auth.supabase.from('comments').insert({ author_id: auth.user.id, body, meme_id: t.id })
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
  const score = parsed.data.score
  const { error } =
    t.column === 'game_id'
      ? await auth.supabase.from('ratings').upsert({ user_id: auth.user.id, game_id: t.id, score }, { onConflict: 'user_id,game_id' })
      : await auth.supabase.from('ratings').upsert({ user_id: auth.user.id, cocktail_id: t.id, score }, { onConflict: 'user_id,cocktail_id' })
  if (error) console.error('rate', error.message)
  revalidatePath(t.path)
  revalidatePath('/feed')
}

// ─── Variations (games or cocktails) ────────────────────────────────────────

const variationTarget = (formData: FormData) => {
  const t = target(formData)
  return { ...t, table: t.kind === 'game' ? 'game_variations' as const : 'cocktail_variations' as const }
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
  const { title, rules } = parsed.data
  const { error } =
    t.table === 'game_variations'
      ? await auth.supabase.from('game_variations').insert({ game_id: t.id, author_id: auth.user.id, title, rules })
      : await auth.supabase.from('cocktail_variations').insert({ cocktail_id: t.id, author_id: auth.user.id, title, rules })
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

/** Author edits their own comment. RLS refuses hidden comments and comments under hidden posts. */
export async function updateOwnComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const t = commentTarget(formData)
  const commentId = String(formData.get('commentId'))
  if (!UUID.test(commentId) || !UUID.test(t.id)) return { error: 'Unknown comment' }
  const parsed = commentSchema.safeParse({ body: String(formData.get('body') ?? '').trim() })
  if (!parsed.success) return fail(formData, 'Comments are 1–1000 characters', fieldErrors(parsed.error.issues))
  const { data: existing } = await auth.supabase.from('comments').select('author_id, is_hidden').eq('id', commentId).maybeSingle()
  if (!existing || existing.author_id !== auth.user.id) return fail(formData, 'You can only edit your own comments.')
  if (existing.is_hidden) return fail(formData, HIDDEN_LOCKED)
  const { data, error } = await auth.supabase.from('comments').update({ body: parsed.data.body })
    .eq('id', commentId).eq('author_id', auth.user.id).select('id')
  if (error || !data?.length) return fail(formData, error ? friendlyError(error) : NOT_SAVED)
  revalidatePath(t.path)
  return { ok: true }
}

/** Author edits their own game or cocktail variation. Same hidden rules as comments. */
export async function updateOwnVariation(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const t = variationTarget(formData)
  const variationId = String(formData.get('variationId'))
  if (!UUID.test(variationId) || !UUID.test(t.id)) return { error: 'Unknown variation' }
  const parsed = variationSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    rules: String(formData.get('rules') ?? '').trim(),
  })
  if (!parsed.success) return fail(formData, 'Give your variation a name (3–80 chars) and details (10–3000 chars)', fieldErrors(parsed.error.issues))
  const { data: existing } = await auth.supabase.from(t.table).select('author_id, is_hidden').eq('id', variationId).maybeSingle()
  if (!existing || existing.author_id !== auth.user.id) return fail(formData, 'You can only edit your own variations.')
  if (existing.is_hidden) return fail(formData, HIDDEN_LOCKED)
  const { data, error } = await auth.supabase.from(t.table).update(parsed.data)
    .eq('id', variationId).eq('author_id', auth.user.id).select('id')
  if (error || !data?.length) return fail(formData, error ? friendlyError(error) : NOT_SAVED)
  revalidatePath(t.path)
  return { ok: true }
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
