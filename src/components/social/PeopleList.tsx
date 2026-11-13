import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { listPeople } from '@/lib/queries/follows'
import { isOwnStorageUrl } from '@/lib/storage'

export default async function PeopleList({ username, which }: { username: string; which: 'followers' | 'following' }) {
  let name = username
  try { name = decodeURIComponent(username) } catch { /* keep */ }
  const supabase = await createClient()
  if (!supabase) notFound()
  const { data: profile } = await supabase.from('profiles').select('id, username').eq('username', name).maybeSingle()
  if (!profile) notFound()
  const people = await listPeople(profile.id, which)
  return (
    <>
      <Link href={`/profile/${profile.username}`} className="text-sm text-ink-2 hover:text-ink">← @{profile.username}</Link>
      <div className="mt-3"><PageHeader title={which === 'followers' ? 'Followers' : 'Following'} subtitle={`@${profile.username}`} /></div>
      <div className="flex gap-4 text-sm mb-4">
        <Link href={`/profile/${profile.username}/followers`} className={which === 'followers' ? 'text-accent font-semibold' : 'text-ink-2'}>Followers</Link>
        <Link href={`/profile/${profile.username}/following`} className={which === 'following' ? 'text-accent font-semibold' : 'text-ink-2'}>Following</Link>
      </div>
      {people.length === 0 ? <p className="text-ink-2 text-sm" data-testid="people-empty">{which === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</p> : (
        <ul className="grid gap-2 sm:grid-cols-2" data-testid="people-list">
          {people.map((p) => (
            <li key={p.id}>
              <Link href={`/profile/${p.username}`} className="card hover:bg-raised p-3 flex items-center gap-3" data-testid="person">
                {isOwnStorageUrl(p.avatar_url) ? <Image src={p.avatar_url!} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" /> : <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center" aria-hidden="true">🙂</span>}
                <span className="min-w-0"><span className="block font-semibold truncate">{p.display_name || `@${p.username}`}</span>{p.display_name && <span className="block text-xs text-ink-3">@{p.username}</span>}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
