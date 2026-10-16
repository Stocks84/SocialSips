'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin, UUID } from '@/lib/server/auth'
import { TARGETS, type TargetType } from '@/lib/server/moderation'
import { removeImage } from '@/lib/server/uploads'

/** Shared parse + admin check. Returns null if not allowed / bad input. */
async function prep(formData: FormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return null
  const type = String(formData.get('targetType')) as TargetType
  const targetId = String(formData.get('targetId'))
  const reportId = String(formData.get('reportId'))
  if (!(type in TARGETS) || !UUID.test(targetId) || !UUID.test(reportId)) return null
  return { ...auth, type, targetId, reportId, cfg: TARGETS[type] }
}

/** Closes every open report about the same item. */
async function closeReports(p: NonNullable<Awaited<ReturnType<typeof prep>>>, status: 'reviewed' | 'dismissed') {
  await p.supabase.from('reports').update({ status }).eq('target_type', p.type).eq('target_id', p.targetId).eq('status', 'open')
}

export async function dismissReport(formData: FormData) {
  const p = await prep(formData)
  if (!p) return
  await p.supabase.from('reports').update({ status: 'dismissed' }).eq('id', p.reportId)
  revalidatePath('/admin/reports')
}

export async function hideItem(formData: FormData) {
  const p = await prep(formData)
  if (!p) return
  const { error } = await p.supabase.from(p.cfg.table).update({ is_hidden: true }).eq('id', p.targetId)
  if (error) return
  await closeReports(p, 'reviewed')
  revalidatePath('/', 'layout')
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
}
