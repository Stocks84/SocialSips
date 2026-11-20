import { Suspense } from 'react'
import Link from 'next/link'
import { faCircleUser } from '@fortawesome/free-regular-svg-icons'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import SubmitButton from '@/components/ui/SubmitButton'
import { Icon } from '@/components/ui/Icon'
import { userIdFromClaims, usernameFromClaims } from '@/lib/auth-claims'
import NotificationBell, { BellFallback } from '@/components/layout/NotificationBell'

/** Shows Sign in, or @username + Sign out, based on the verified session JWT. */
export default async function AuthButton() {
  const supabase = await createClient()
  const claims = supabase ? (await supabase.auth.getClaims()).data?.claims : null
  if (!userIdFromClaims(claims)) return <Link href="/sign-in" className="btn-secondary min-h-11 text-[15px]">Sign in</Link>
  const username = usernameFromClaims(claims) ?? 'me'
  return (
    <div className="flex items-center gap-0.5 sm:gap-2">
      <Suspense fallback={<BellFallback />}>
        <NotificationBell />
      </Suspense>
      <Link href={`/profile/${username}`} className="btn-ghost px-2.5 sm:min-w-11" aria-label="Your profile"><span className="sm:hidden"><Icon icon={faCircleUser} className="text-icon-md" /></span><span className="hidden sm:inline">@{username}</span></Link>
      <Link href="/settings/profile" className="btn-ghost px-2.5 sm:min-w-11" aria-label="Edit profile" title="Edit profile" data-testid="nav-edit-profile"><Icon icon={faGear} className="text-icon-md" /></Link>
      <form action={signOut}>
        <SubmitButton className="btn-secondary min-h-11 text-sm px-2 sm:px-4 whitespace-nowrap" pendingLabel="Signing out…">Sign out</SubmitButton>
      </form>
    </div>
  )
}
