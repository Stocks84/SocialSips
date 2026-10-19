import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'

/** Shows Sign in, or @username + Sign out, based on the server session. */
export default async function AuthButton() {
  const supabase = await createClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null
  if (!user) return <Link href="/sign-in" className="btn-secondary text-sm py-2 px-4">Sign in</Link>
  const username = (user.user_metadata?.username as string | undefined) ?? 'me'
  return (
    <div className="flex items-center gap-2">
      <Link href={`/profile/${username}`} className="btn-ghost text-sm">@{username}</Link>
      <Link href="/settings/profile" className="btn-ghost text-sm" aria-label="Edit profile" title="Edit profile" data-testid="nav-edit-profile">⚙️</Link>
      <form action={signOut}>
        <button className="btn-secondary text-sm py-2 px-4">Sign out</button>
      </form>
    </div>
  )
}
