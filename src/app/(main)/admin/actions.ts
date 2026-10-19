'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin, UUID } from '@/lib/server/auth'
import { TARGETS, type TargetType } from '@/lib/server/moderation'
import { removeImage } from '@/lib/server/uploads'
import { safePath } from '@/lib/safe-path'
import { variationSchema } from '@/lib/validators/game'
import { friendlyError, NOT_SAVED } from '@/lib/server/errors'
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

/** Closes every open report about the same item. */
async function closeReports(p: Prepped, status: 'reviewed' | 'dismissed') {
  await p.supabase.from('reports').update({ status }).eq('target_type', p.type).eq('target_id', p.targetId).eq('status', 'open')
}

/** Optional post-action redirect (only same-site paths). */
function maybeRedirect(formData: FormData) {
  const to = formData.get('redirectTo')
  if (to) redirect(safePath(to))
}

export async function dismissReport(formData: FormData) {
  const p = await prep(formData)
  if (!p || !p.reportId) return
  await p.supabase.from('reports').update({ status: 'dismissed' }).eq('id', p.reportId)
  revalidatePath('/admin/reports')
}

async function setHidden(formData: FormData, hidden: boolean) {
  const p = await prep(formData)
  if (!p) return
  const { error } = await p.supabase.from(p.cfg.table).update({ is_hidden: hidden }).eq('id', p.targetId)
  if (error) return
  if (hidden) await closeReports(p, 'reviewed')
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
  const { error } = await p.supabase.from(p.cfg.table).delete().eq('id', p.targetId)
  if (error) return
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
