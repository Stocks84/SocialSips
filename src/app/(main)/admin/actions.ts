'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin, UUID } from '@/lib/server/auth'
import { TARGETS, type TargetType } from '@/lib/server/moderation'
import { removeImage } from '@/lib/server/uploads'

/** Shared parse + admin check. Returns null if not allowed / bad input. */
async function prep(formData: FormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return null
  const type = String(formData.get('targetType')) as TargetType
  const targetId = String(formData.get('targetId'))
  if (!(type in TARGETS) || !UUID.test(targetId)) return null
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
  const to = String(formData.get('redirectTo') ?? '')
  if (to.startsWith('/') && !to.startsWith('//')) redirect(to)
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
  if (p.cfg.imageCol) {
    const { data } = await p.supabase.from(p.cfg.table).select(p.cfg.imageCol).eq('id', p.targetId).maybeSingle()
    imageUrl = (data as Record<string, string | null> | null)?.[p.cfg.imageCol] ?? null
  }
  const { error } = await p.supabase.from(p.cfg.table).delete().eq('id', p.targetId)
  if (error) return
  if (p.cfg.bucket) await removeImage(p.supabase, p.cfg.bucket, imageUrl)
  await closeReports(p, 'reviewed')
  revalidatePath('/', 'layout')
  maybeRedirect(formData)
}
