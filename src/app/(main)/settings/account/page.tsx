import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import DeleteAccountForm from '@/components/settings/DeleteAccountForm'
import { getAccountPageData } from '@/lib/queries/settings'
import { getViewer } from '@/lib/server/viewer'
import { REPORT_REASONS } from '@/lib/validators/comment'
import { formatDate } from '@/lib/format'
import { deleteAccount, setBlock } from '../actions'

export const metadata = { title: 'Account' }
export const dynamic = 'force-dynamic'

const STATUS: Record<string, string> = { open: 'Waiting for review', resolved: 'Reviewed', dismissed: 'Reviewed' }
const OUTCOME: Record<string, string> = { action_taken: 'action taken', no_action: 'no action needed' }

export default async function AccountPage() {
  const { userId } = await getViewer()
  if (!userId) redirect('/sign-in?redirectTo=/settings/account')
  const data = await getAccountPageData(userId)
  if (!data) notFound()
  const { username, reports, blocks } = data
  return (
    <>
      <Link href={`/profile/${username}`} className="text-sm text-text-secondary hover:text-accent-cyan">← Back to your profile</Link>
      <div className="mt-3"><PageHeader emoji="🔐" title="Account" subtitle="Your reports, blocks and data." /></div>

      <section className="card p-5 mb-6" data-testid="my-reports">
        <h2 className="font-bold mb-3">🚩 Your reports</h2>
        {!reports.length ? <p className="text-sm text-text-secondary">You haven&apos;t reported anything.</p> : (
          <ul className="space-y-2 text-sm">{reports.map((r) => (
            <li key={r.id} className="flex flex-wrap justify-between gap-2" data-testid="my-report">
              <span>{r.target_type} · {REPORT_REASONS[r.reason as keyof typeof REPORT_REASONS] ?? r.reason} · {formatDate(r.created_at)}</span>
              <span className="text-text-secondary" data-testid="my-report-status">{STATUS[r.status] ?? r.status}{r.outcome ? ` — ${OUTCOME[r.outcome] ?? r.outcome}` : ''}</span>
            </li>))}</ul>
        )}
      </section>

      <section className="card p-5 mb-6" data-testid="my-blocks">
        <h2 className="font-bold mb-3">🚫 Blocked users</h2>
        {!blocks.length ? <p className="text-sm text-text-secondary">You haven&apos;t blocked anyone.</p> : (
          <ul className="space-y-2">{blocks.map((b) => (
            <li key={b.blocked_id} className="flex items-center justify-between gap-2 text-sm">
              <span>@{b.blocked?.username ?? 'deleted user'}</span>
              <form action={setBlock}><input type="hidden" name="userId" value={b.blocked_id} /><input type="hidden" name="block" value="0" /><input type="hidden" name="back" value="/settings/account" />
                <button className="btn-secondary text-xs py-1 px-3" data-testid="unblock-btn">Unblock</button></form>
            </li>
          ))}</ul>
        )}
      </section>

      <section className="card p-5 mb-6">
        <h2 className="font-bold mb-2">📦 Download my data</h2>
        <p className="text-sm text-text-secondary mb-3">A JSON file with everything we store about you.</p>
        <a href="/settings/account/export" className="btn-secondary text-sm" data-testid="export-link" download>Download my data</a>
      </section>

      <section className="card p-5 border-red-500/40">
        <h2 className="font-bold mb-2 text-red-400">⚠️ Delete account</h2>
        <DeleteAccountForm action={deleteAccount} username={username} />
      </section>
    </>
  )
}
