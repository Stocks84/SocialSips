import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { TARGETS } from '@/lib/server/moderation'
import { listOpenReports } from '@/lib/queries/admin'
import { REPORT_REASONS } from '@/lib/validators/comment'
import { formatDate } from '@/lib/format'
import { deleteItem, dismissReport, hideItem } from '../actions'
import ModReasonFields from '@/components/admin/ModReasonFields'

export const metadata = { title: 'Reports', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { isAdmin } = await getViewer()
  if (!supabase || !isAdmin) notFound()

  const reports = (await listOpenReports()) ?? []

  return (
    <>
      <PageHeader emoji="🛡️" title="Reports" subtitle={`${reports.length} open`} />
      <p className="text-sm mb-6"><Link href="/admin/hidden" className="text-accent-purple">Hidden items →</Link> · <Link href="/admin/challenges" className="text-accent-purple" data-testid="admin-challenges-link">Challenges →</Link></p>
      {reports.length === 0 && <p className="card-glass p-6 text-center text-text-secondary">All clear. No open reports 🎉</p>}
      <div className="space-y-4">
        {reports.map((r) => {
          const t = r.resolved
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
