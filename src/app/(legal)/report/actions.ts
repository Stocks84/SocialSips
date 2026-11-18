'use server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { recordFailure, throttleOk } from '@/lib/server/throttle'
import { clientIp } from '@/lib/server/request'
import { fail } from '@/lib/server/forms'
import { publicReportSchema } from '@/lib/validators/comment'
import { fieldErrors, type EditState } from '@/lib/validators/issues'
import { maybeSendModerationAlertEmail } from '@/lib/server/moderation-alert-email'
import { parseReportUrl, reportTargetFromParsed, type CommentParentRow } from '@/lib/report-url'

/** Look up a comment to attach to a public report. Never selects the body, so hidden text can't leak. */
async function loadCommentForReport(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  id: string,
): Promise<CommentParentRow | null> {
  const { data } = await supabase
    .from('comments')
    .select('id, game_id, cocktail_id, meme_id, is_hidden')
    .eq('id', id)
    .maybeSingle()
  return (data as CommentParentRow | null) ?? null
}

/** Notice-and-action form (DSA Art. 16) for anyone, signed in or not. Max 10 reports per IP per 15 minutes. */
export async function submitPublicReport(_prev: EditState, formData: FormData): Promise<EditState> {
  const str = (k: string) => { const v = formData.get(k); return typeof v === 'string' && v.trim() ? v : undefined }
  const parsed = publicReportSchema.safeParse({
    targetType: str('targetType'), targetId: str('targetId'), url: str('url'), reason: str('reason'),
    note: String(formData.get('note') ?? ''), email: String(formData.get('email') ?? ''), goodFaith: formData.get('goodFaith') === 'true',
  })
  if (!parsed.success) return fail(formData, 'Check the form', fieldErrors(parsed.error.issues))
  const r = parsed.data
  const supabase = await createClient()
  const secret = process.env.AUTH_THROTTLE_SECRET
  if (!supabase || !secret) return fail(formData, 'Reporting is unavailable right now. Please email us instead.')

  const keys = [`report-ip:${await clientIp()}`]
  if (!(await throttleOk(supabase, keys))) return fail(formData, 'You’ve sent a lot of reports. Please wait 15 minutes and try again.')
  await recordFailure(supabase, keys) // counts every report towards the IP limit

  const host = (await headers()).get('host')
  const fromUrl = r.url ? parseReportUrl(r.url, host) : null
  const comment = fromUrl?.commentId ? await loadCommentForReport(supabase, fromUrl.commentId) : null
  const resolved = reportTargetFromParsed(fromUrl, comment)
  const type = r.targetType && r.targetId ? r.targetType : resolved.type
  const id = r.targetType && r.targetId ? r.targetId : resolved.id
  const { error } = await supabase.rpc('submit_public_report', {
    p_secret: secret, p_target_type: type, p_target_id: id, p_target_url: r.url ?? null,
    p_reason: r.reason, p_note: r.note, p_email: r.email || null,
  })
  if (error) {
    console.error('submit_public_report', error.code, error.message)
    return fail(formData, 'We couldn’t send your report. Please try again, or email us.')
  }
  await maybeSendModerationAlertEmail({ targetType: type })
  return { ok: true }
}
