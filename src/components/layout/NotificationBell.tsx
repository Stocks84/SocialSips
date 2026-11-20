import Link from 'next/link'
import { faBell } from '@fortawesome/free-regular-svg-icons'
import { getUnreadCount } from '@/lib/queries/follows'
import { Icon } from '@/components/ui/Icon'

const bellClass = 'btn-ghost relative px-2.5 sm:min-w-11'

/** Same size as the real bell, so the nav does not shift when the unread count arrives. */
export function BellFallback() {
  return (
    <Link href="/notifications" className={bellClass} aria-label="Notifications" aria-busy="true" data-testid="nav-bell">
      <Icon icon={faBell} className="text-icon-md animate-pulse" />
    </Link>
  )
}

/** Unread badge for the nav bell. Streamed behind Suspense so AuthButton can paint first. */
export default async function NotificationBell() {
  const unread = await getUnreadCount()
  return (
    <Link
      href="/notifications"
      className={bellClass}
      aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      data-testid="nav-bell"
    >
      <Icon icon={faBell} className="text-icon-md" />
      {unread > 0 && (
        <span
          className="absolute top-1 right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-sm bg-accent text-on-accent text-[10px] leading-[1.1rem] text-center font-bold tabular-nums"
          data-testid="bell-count"
        >
          {unread >= 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
