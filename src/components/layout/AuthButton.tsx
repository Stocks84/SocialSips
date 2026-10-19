import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import { getUnreadCount } from '@/lib/queries/follows'

/** Shows Sign in, or @username + Sign out, based on the server session. */
export default async function AuthButton() {
  const supabase = await createClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null
  if (!user) return <Link href="/sign-in" className="btn-secondary text-sm py-2 px-4">Sign in</Link>
  const username = (user.user_metadata?.username as string | undefined) ?? 'me'
  const unread = await getUnreadCount()
  return (
    <div className="flex items-center gap-0.5 sm:gap-2">
      <Link href="/notifications" className="btn-ghost text-sm relative" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} data-testid="nav-bell">
        🔔{unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-accent-pink text-white text-[10px] leading-[1.1rem] text-center font-bold" data-testid="bell-count">{unread >= 99 ? '99+' : unread}</span>}
      </Link>
      <Link href={`/profile/${username}`} className="btn-ghost text-sm" aria-label="Your profile"><span className="sm:hidden" aria-hidden="true">👤</span><span className="hidden sm:inline">@{username}</span></Link>
      <Link href="/settings/profile" className="btn-ghost text-sm" aria-label="Edit profile" title="Edit profile" data-testid="nav-edit-profile">⚙️</Link>
      <form action={signOut}>
        <button className="btn-secondary text-sm py-2 px-3 sm:px-4 whitespace-nowrap">Sign out</button>
      </form>
    </div>
  )
}
