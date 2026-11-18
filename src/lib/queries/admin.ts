import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { resolveTargets, type TargetType, type ResolvedTarget } from '@/lib/server/moderation'
import { REPORT_REASONS } from '@/lib/validators/comment'

export type OpenReportRow = {
  id: string
  target_type: TargetType | 'link'
  target_id: string | null
  target_url: string | null
  reason: keyof typeof REPORT_REASONS
  note: string | null
  reporter_email: string | null
  created_at: string
  reporter: { username: string } | null
}

export type OpenReportWithTarget = OpenReportRow & { resolved: ResolvedTarget }

/** Open reports for the admin queue, with resolved target previews. Null if not configured. */
export async function listOpenReports(): Promise<OpenReportWithTarget[] | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const { data } = await supabase
    .from('reports')
    .select('id, target_type, target_id, target_url, reason, note, reporter_email, created_at, reporter:profiles(username)')
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(100)
  const reports = (data ?? []) as unknown as OpenReportRow[]
  const typed = reports.filter(
    (r): r is OpenReportRow & { target_type: TargetType; target_id: string } =>
      r.target_type !== 'link' && Boolean(r.target_id),
  )
  const resolvedTyped = await resolveTargets(
    supabase,
    typed.map((r) => ({ type: r.target_type, id: r.target_id })),
  )
  const byId = new Map(typed.map((r, i) => [r.id, resolvedTyped[i]]))
  const linkTarget = (r: OpenReportRow): ResolvedTarget => ({
    exists: false,
    href: null,
    preview: r.target_url ?? '(no link)',
    hidden: false,
  })
  return reports.map((r) => ({ ...r, resolved: byId.get(r.id) ?? linkTarget(r) }))
}

/** Open reports in the queue. 0 for non-admins (do not rely on RLS alone). Capped display is separate. */
export const getOpenReportCount = cache(async (): Promise<number> => {
  const { isAdmin } = await getViewer()
  if (!isAdmin) return 0
  const supabase = await createClient()
  if (!supabase) return 0
  const { count, error } = await supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open')
  if (error) {
    console.error('open report count', error.message)
    return 0
  }
  return count ?? 0
})
