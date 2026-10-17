import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { resolveTargets, TARGETS, type TargetType } from '@/lib/server/moderation'
import { REPORT_REASONS } from '@/lib/validators/comment'
import { formatDate } from '@/lib/format'
import { deleteItem, dismissReport, hideItem } from '../actions'

export const metadata = { title: 'Reports', robots: { index: false } }
export const dynamic = 'force-dynamic'

type ReportRow = {
  id: string; target_type: TargetType; target_id: string; reason: keyof typeof REPORT_REASONS
  note: string | null; created_at: string; reporter: { username: string } | null
}

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { isAdmin } = await getViewer()
  if (!supabase || !isAdmin) notFound()

  const { data } = await supabase
    .from('reports')
    .select('id, target_type, target_id, reason, note, created_at, reporter:profiles(username)')
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(100)
  const reports = (data ?? []) as unknown as ReportRow[]
  const resolved = await resolveTargets(supabase, reports.map((r) => ({ type: r.target_type, id: r.target_id })))

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
              <input type="hidden" name="targetId" value={r.target_id} />
            </>
          )
          return (
            <div key={r.id} className="card p-5" data-testid="report">
              <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                <span className="badge badge-purple">{TARGETS[r.target_type].label}</span>
                <span className="badge badge-pink">{REPORT_REASONS[r.reason] ?? r.reason}</span>
                {t.hidden && <span className="badge badge-cyan">Hidden</span>}
                <span className="text-text-muted">by @{r.reporter?.username ?? 'someone'} · {formatDate(r.created_at)}</span>
              </div>
              <p className="text-sm mb-1">
                {t.href ? <Link href={t.href} className="text-accent-cyan hover:underline">{t.preview || 'View item'}</Link> : <span className="text-text-muted">{t.preview}</span>}
              </p>
              {r.note && <p className="text-text-secondary text-sm italic">“{r.note}”</p>}
              <div className="flex flex-wrap gap-2 mt-4">
                <form action={dismissReport}>{hidden}<button className="btn-ghost text-sm">Dismiss</button></form>
                {t.exists && !t.hidden && <form action={hideItem}>{hidden}<button className="btn-secondary text-sm py-2 px-4">Hide item</button></form>}
                {t.exists && <form action={deleteItem}>{hidden}<button className="btn-danger text-sm py-2 px-4">Delete item</button></form>}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
