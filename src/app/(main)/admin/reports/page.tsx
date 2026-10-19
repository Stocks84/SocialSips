import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { resolveTargets, TARGETS, type TargetType } from '@/lib/server/moderation'
import { REPORT_REASONS } from '@/lib/validators/comment'
import { formatDate } from '@/lib/format'
import { deleteItem, dismissReport, hideItem } from '../actions'
import ModReasonFields from '@/components/admin/ModReasonFields'

export const metadata = { title: 'Reports', robots: { index: false } }
export const dynamic = 'force-dynamic'

type ReportRow = {
  id: string; target_type: TargetType | 'link'; target_id: string | null; target_url: string | null; reason: keyof typeof REPORT_REASONS
  note: string | null; reporter_email: string | null; created_at: string; reporter: { username: string } | null
}

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { isAdmin } = await getViewer()
  if (!supabase || !isAdmin) notFound()

  const { data } = await supabase
    .from('reports')
    .select('id, target_type, target_id, target_url, reason, note, reporter_email, created_at, reporter:profiles(username)')
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(100)
  const reports = (data ?? []) as unknown as ReportRow[]
  const typed = reports.filter((r): r is ReportRow & { target_type: TargetType; target_id: string } => r.target_type !== 'link' && Boolean(r.target_id))
  const resolvedTyped = await resolveTargets(supabase, typed.map((r) => ({ type: r.target_type, id: r.target_id })))
  const byId = new Map(typed.map((r, i) => [r.id, resolvedTyped[i]]))
  const linkTarget = (r: ReportRow) => ({ exists: false, href: null, preview: r.target_url ?? '(no link)', hidden: false })
  const resolved = reports.map((r) => byId.get(r.id) ?? linkTarget(r))

  return (
    <>
      <PageHeader emoji="🛡️" title="Reports" subtitle={`${reports.length} open`} />
      <p className="text-sm mb-6"><Link href="/admin/hidden" className="text-accent-purple">Hidden items →</Link></p>
      {reports.length === 0 && <p className="card-glass p-6 text-center text-text-secondary">All clear. No open reports 🎉</p>}
      <div className="space-y-4">
        {reports.map((r, i) => {
          const t = resolved[i]
          const hidden = (
            <>
              <input type="hidden" name="reportId" value={r.id} />
              <input type="hidden" name="targetType" value={r.target_type} />
              <input type="hidden" name="targetId" value={r.target_id ?? ''} />
            </>
          )
          return (
            <div key={r.id} className="card p-5" data-testid="report">
              <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                <span className="badge badge-purple">{r.target_type === 'link' ? 'Link' : TARGETS[r.target_type].label}</span>
                <span className="badge badge-pink">{REPORT_REASONS[r.reason] ?? r.reason}</span>
                {t.hidden && <span className="badge badge-cyan">Hidden</span>}
                <span className="text-text-muted" data-testid="reporter">by {r.reporter ? `@${r.reporter.username}` : 'a signed-out visitor'}{r.reporter_email ? ` (${r.reporter_email})` : ''} · {formatDate(r.created_at)}</span>
              </div>
              <p className="text-sm mb-1">
                {t.href ? <Link href={t.href} className="text-accent-cyan hover:underline">{t.preview || 'View item'}</Link> : <span className="text-text-muted break-all">{t.preview}</span>}
              </p>
              {r.note && <p className="text-text-secondary text-sm italic">“{r.note}”</p>}
              <form className="mt-4 space-y-2 max-w-md">
                {hidden}
                {t.exists && <ModReasonFields defaultReason={r.reason} />}
                <div className="flex flex-wrap gap-2">
                  <button formAction={dismissReport} formNoValidate className="btn-ghost text-sm" data-testid="report-dismiss">{t.exists ? 'Dismiss' : 'Close report'}</button>
                  {t.exists && !t.hidden && <button formAction={hideItem} className="btn-secondary text-sm py-2 px-4" data-testid="report-hide">Hide item</button>}
                  {t.exists && <button formAction={deleteItem} className="btn-danger text-sm py-2 px-4">Delete item</button>}
                </div>
              </form>
            </div>
          )
        })}
      </div>
    </>
  )
}
