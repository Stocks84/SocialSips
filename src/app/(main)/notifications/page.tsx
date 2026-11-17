import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { getViewer } from '@/lib/server/viewer'
import { listNotifications } from '@/lib/queries/follows'
import { notificationText } from '@/lib/notifications'
import { markAllRead, markRead } from './actions'
import SubmitButton from '@/components/ui/SubmitButton'

export const metadata = { title: 'Notifications' }
export const dynamic = 'force-dynamic'

const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default async function NotificationsPage() {
  const { userId } = await getViewer()
  if (!userId) redirect('/sign-in?redirectTo=/notifications')
  const items = await listNotifications(50)
  const unread = items.filter((n) => !n.read_at).length
  return (
    <>
      <PageHeader title="Notifications" subtitle={unread ? `${unread} unread` : 'You’re all caught up.'} />
      {unread > 0 && <form action={markAllRead} className="mb-4"><SubmitButton className="btn-secondary text-sm" data-testid="mark-all-read" pendingLabel="Marking…">Mark all as read</SubmitButton></form>}
      {items.length === 0 ? <p className="card p-6 text-center text-ink-2" data-testid="no-notifications">Nothing yet. Follow people and post something!</p> : (
        <ul className="space-y-2" data-testid="notifications">
          {items.map((n) => {
            const t = notificationText(n)
            return (
              <li key={n.id} className={`card p-4 flex items-start gap-3 ${n.read_at ? 'text-ink-2' : 'border-accent'}`} data-testid="notification" data-kind={n.kind} data-unread={!n.read_at}>
                {/* native form POST (opening marks it read; GET never does): full navigation so the bell count refreshes */}
                <form method="post" action={`/notifications/${n.id}`} className="flex-1 min-w-0">
                  <button type="submit" className="block w-full text-left hover:text-ink" data-testid="open-notification">
                    <span className="block text-sm break-words">{t.text}</span>
                    <span className="block text-xs text-ink-3 mt-1">{ago(n.updated_at)}</span>
                  </button>
                </form>
                {!n.read_at && <form action={markRead}><input type="hidden" name="id" value={n.id} /><SubmitButton className="text-xs text-ink-2 hover:text-ink" aria-label="Mark as read" data-testid="mark-read" pendingLabel="Marking…">● Mark read</SubmitButton></form>}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
