'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin, UUID } from '@/lib/server/auth'
import { TARGETS, type TargetType } from '@/lib/server/moderation'
import { removeImage } from '@/lib/server/uploads'
import { safePath } from '@/lib/safe-path'
import { variationSchema } from '@/lib/validators/game'
import { friendlyError, NOT_SAVED } from '@/lib/server/errors'
import { REPORT_REASONS } from '@/lib/validators/comment'
import { fieldErrors, formValues, type EditState } from '@/lib/validators/issues'

/** Shared parse + admin check. Returns null if not allowed / bad input. */
async function prep(formData: FormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return null
  const type = String(formData.get('targetType')) as TargetType
  const targetId = String(formData.get('targetId'))
  if (!Object.hasOwn(TARGETS, type) || !UUID.test(targetId)) return null
  const reportId = String(formData.get('reportId') ?? '')
  return { ...auth, type, targetId, reportId: UUID.test(reportId) ? reportId : null, cfg: TARGETS[type] }
}
type Prepped = NonNullable<Awaited<ReturnType<typeof prep>>>

/** Closes every open report about the same item, with the outcome reporters can see. */
async function closeReports(p: Prepped, status: 'reviewed' | 'dismissed') {
  await p.supabase.from('reports')
    .update({ status, outcome: status === 'reviewed' ? 'action_taken' : 'no_action', decided_at: new Date().toISOString() })
    .eq('target_type', p.type).eq('target_id', p.targetId).eq('status', 'open')
}

/** Statement of reasons (DSA Art. 17) for the item's author: category + optional explanation. */
async function recordNotice(p: Prepped, formData: FormData, row: Record<string, unknown> | null) {
  const reason = String(formData.get('modReason') ?? '')
  const explanation = String(formData.get('modExplanation') ?? '').trim().slice(0, 1000) || null
  const authorId = (row?.author_id as string | null | undefined) ?? null
  if (!authorId) return
  const text = String(row?.title ?? row?.name ?? row?.caption ?? row?.body ?? row?.joke_text ?? '').slice(0, 200) || null
  const { error } = await p.supabase.from('moderation_notices').insert({
    target_type: p.type, target_id: p.targetId, author_id: authorId,
    reason: Object.hasOwn(REPORT_REASONS, reason) ? reason : 'other', explanation, preview: text,
  })
  if (error) console.error('moderation_notices', error.message)
}

const PREVIEW_COLS: Record<TargetType, string> = {
  game: 'author_id, title', cocktail: 'author_id, name', meme: 'author_id, caption, joke_text',
  comment: 'author_id, body', variation: 'author_id, title', cocktail_variation: 'author_id, title',
}
async function targetRow(p: Prepped) {
  const { data } = await p.supabase.from(p.cfg.table).select(PREVIEW_COLS[p.type]).eq('id', p.targetId).maybeSingle()
  return (data ?? null) as Record<string, unknown> | null
}

/** Optional post-action redirect (only same-site paths). */
function maybeRedirect(formData: FormData) {
  const to = formData.get('redirectTo')
  if (to) redirect(safePath(to))
}

export async function dismissReport(formData: FormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return
  const reportId = String(formData.get('reportId') ?? '')
  if (!UUID.test(reportId)) return
  await auth.supabase.from('reports').update({ status: 'dismissed', outcome: 'no_action', decided_at: new Date().toISOString() }).eq('id', reportId)
  revalidatePath('/admin/reports')
}

async function setHidden(formData: FormData, hidden: boolean) {
  const p = await prep(formData)
  if (!p) return
  const row = hidden ? await targetRow(p) : null
  const { error } = await p.supabase.from(p.cfg.table).update({ is_hidden: hidden }).eq('id', p.targetId)
  if (error) return
  if (hidden) {
    await recordNotice(p, formData, row)
    await closeReports(p, 'reviewed')
  } else {
    await p.supabase.from('moderation_notices').update({ reversed_at: new Date().toISOString() })
      .eq('target_type', p.type).eq('target_id', p.targetId).is('reversed_at', null)
  }
  revalidatePath('/', 'layout')
  maybeRedirect(formData)
}

export async function hideItem(formData: FormData) {
  await setHidden(formData, true)
}

export async function unhideItem(formData: FormData) {
  await setHidden(formData, false)
}

export async function deleteItem(formData: FormData) {
  const p = await prep(formData)
  if (!p) return
  let imageUrl: string | null = null
  let ownerId: string | null = null
  if (p.cfg.imageCol) {
    const { data } = await p.supabase.from(p.cfg.table).select(`${p.cfg.imageCol}, author_id`).eq('id', p.targetId).maybeSingle()
    const row = data as Record<string, string | null> | null
    imageUrl = row?.[p.cfg.imageCol] ?? null
    ownerId = row?.author_id ?? null
  }
  const row = await targetRow(p)
  const { error } = await p.supabase.from(p.cfg.table).delete().eq('id', p.targetId)
  if (error) return
  await recordNotice(p, formData, row)
  // Only touch the owner's folder; if the author account is gone (null), admins may still clean up.
  if (p.cfg.bucket) await removeImage(p.supabase, p.cfg.bucket, imageUrl, ownerId ?? undefined)
  await closeReports(p, 'reviewed')
  revalidatePath('/', 'layout')
  maybeRedirect(formData)
}

/** Admin-only: edit a variation's title and text (game or cocktail). RLS "admin update" + column grants back this up. */
export async function editVariation(_prev: EditState, formData: FormData): Promise<EditState> {
  const values = formValues(formData)
  const p = await prep(formData)
  if (!p || (p.type !== 'variation' && p.type !== 'cocktail_variation')) return { error: 'Only moderators can edit variations.', values }
  const parsed = variationSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    rules: String(formData.get('rules') ?? '').trim(),
  })
  if (!parsed.success) return { error: 'Name 3–80 characters, details 10–3000.', fieldErrors: fieldErrors(parsed.error.issues), values }
  const { data, error } = await p.supabase.from(p.cfg.table).update(parsed.data).eq('id', p.targetId).select('id')
  if (error || !data?.length) return { error: error ? friendlyError(error) : NOT_SAVED, values }
  revalidatePath('/', 'layout')
  maybeRedirect(formData)
  return { ok: true }
}
