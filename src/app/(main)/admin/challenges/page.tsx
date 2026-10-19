import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { getViewer } from '@/lib/server/viewer'
import { getCurrentChallenge, listChallenges } from '@/lib/queries/challenges'
import { KIND_LABEL, weekLabel } from '@/lib/challenge'
import { deleteChallenge, scheduleChallenge } from './actions'

export const metadata = { title: 'Challenges · Admin' }
export const dynamic = 'force-dynamic'

const addDays = (iso: string, n: number) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10) }

export default async function AdminChallengesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { isAdmin } = await getViewer()
  if (!isAdmin) notFound()
  const { error, saved } = await searchParams
  const cur = await getCurrentChallenge()
  if (!cur) notFound()
  const upcoming = await listChallenges({ from: cur.starts_on, limit: 20 })
  const byWeek = new Map(upcoming.map((u) => [u.starts_on, u]))
  const weeks = Array.from({ length: 12 }, (_, i) => addDays(cur.starts_on, 7 * (i + 1)))
  return (
    <>
      <PageHeader emoji="🏆" title="Weekly challenges" subtitle="Schedule themes for coming weeks. Weeks run Monday 00:00 to Sunday 23:59, Vienna time. Unscheduled weeks get a default (meme / cocktail of the week, alternating)." />
      <p className="text-sm mb-6 flex gap-4"><Link href="/admin/reports" className="text-accent-purple">← Reports</Link><Link href="/challenge" className="text-accent-purple">View current challenge →</Link></p>
      {error && <p role="alert" className="card p-4 mb-4 text-sm text-red-400" data-testid="admin-challenge-error">{error.slice(0, 200)}</p>}
      {saved && <p role="status" className="card p-4 mb-4 text-sm text-accent-cyan">Saved ✅</p>}
      <section className="card p-5 mb-6">
        <h2 className="font-bold mb-1">This week</h2>
        <p className="text-sm"><strong>{cur.theme}</strong> · {KIND_LABEL[cur.kind]} · {weekLabel(cur.starts_on)}{cur.is_default ? ' · default' : ''} <span className="text-text-muted">(running challenges can&apos;t be changed)</span></p>
      </section>
      <section className="card p-5 mb-6">
        <h2 className="font-bold mb-3">Schedule a week</h2>
        <form action={scheduleChallenge} className="grid gap-3 sm:grid-cols-2" data-testid="schedule-form">
          <label className="text-sm">Week
            <select name="startsOn" className="input mt-1" required>{weeks.map((w) => <option key={w} value={w}>{weekLabel(w)}{byWeek.has(w) ? ` (replaces “${byWeek.get(w)!.theme}”)` : ''}</option>)}</select>
          </label>
          <label className="text-sm">Type
            <select name="kind" className="input mt-1" required><option value="meme">Meme</option><option value="cocktail_variation">Cocktail variation</option></select>
          </label>
          <label className="text-sm sm:col-span-2">Theme
            <input name="theme" className="input mt-1" required minLength={3} maxLength={80} placeholder="e.g. Best summer spritz twist" />
          </label>
          <label className="text-sm sm:col-span-2">Description (optional)
            <textarea name="description" rows={3} maxLength={500} className="input mt-1" placeholder="What should people make?" />
          </label>
          <button className="btn-primary sm:col-span-2 justify-self-start" data-testid="schedule-btn">Schedule</button>
        </form>
      </section>
      <h2 className="font-bold mb-3">Scheduled</h2>
      {upcoming.length === 0 ? <p className="text-sm text-text-secondary">Nothing scheduled. Coming weeks will use the default.</p> : (
        <ul className="space-y-2" data-testid="scheduled-list">{upcoming.map((u) => (
          <li key={u.id} className="card p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span><strong>{u.theme}</strong> · {KIND_LABEL[u.kind]} · {weekLabel(u.starts_on)}</span>
            <form action={deleteChallenge}><input type="hidden" name="id" value={u.id} /><button className="btn-ghost text-sm" data-testid="delete-challenge">Remove</button></form>
          </li>))}</ul>
      )}
    </>
  )
}
