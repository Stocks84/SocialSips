import Link from 'next/link'
import { faBell, faCircleUser } from '@fortawesome/free-regular-svg-icons'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import { getUnreadCount } from '@/lib/queries/follows'
import SubmitButton from '@/components/ui/SubmitButton'
import { Icon } from '@/components/ui/Icon'

/** Shows Sign in, or @username + Sign out, based on the server session. */
export default async function AuthButton() {
  const supabase = await createClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null
  if (!user) return <Link href="/sign-in" className="btn-secondary btn-sm text-[15px]">Sign in</Link>
  const username = (user.user_metadata?.username as string | undefined) ?? 'me'
  const unread = await getUnreadCount()
  return (
    <div className="flex items-center gap-0.5 sm:gap-2">
      <Link href="/notifications" className="btn-ghost relative px-2.5" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} data-testid="nav-bell">
        <Icon icon={faBell} className="text-icon-md" />
        {unread > 0 && <span className="absolute top-1 right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-sm bg-accent text-on-accent text-[10px] leading-[1.1rem] text-center font-bold tabular-nums" data-testid="bell-count">{unread >= 99 ? '99+' : unread}</span>}
      </Link>
      <Link href={`/profile/${username}`} className="btn-ghost px-2.5" aria-label="Your profile"><span className="sm:hidden"><Icon icon={faCircleUser} className="text-icon-md" /></span><span className="hidden sm:inline">@{username}</span></Link>
      <Link href="/settings/profile" className="btn-ghost px-2.5" aria-label="Edit profile" title="Edit profile" data-testid="nav-edit-profile"><Icon icon={faGear} className="text-icon-md" /></Link>
      <form action={signOut}>
        <SubmitButton className="btn-secondary btn-sm text-sm px-3 sm:px-4 whitespace-nowrap" pendingLabel="Signing out…">Sign out</SubmitButton>
      </form>
    </div>
  )
}
