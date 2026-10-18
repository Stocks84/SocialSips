import Link from 'next/link'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ComingSoon from '@/components/ui/ComingSoon'
import HiddenNotice from '@/components/ui/HiddenNotice'
import { createClient } from '@/lib/supabase/server'
import { visibleTo } from '@/lib/queries/visibility'

type Post = { id: string; title: string; is_hidden: boolean; created_at: string; href: string; emoji: string }

/** Games + cocktails a user shared. The owner also sees their hidden ones (badged); RLS hides them from everyone else. */
async function getPosts(username: string): Promise<{ posts: Post[]; isOwner: boolean } | null> {
  const supabase = await createClient()
  if (!supabase) return null
  const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()
  if (!profile) return { posts: [], isOwner: false }
  const { data: { user } } = await supabase.auth.getUser()
  const filter = visibleTo(user?.id)
  const [{ data: games }, { data: cocktails }] = await Promise.all([
    supabase.from('games').select('id, title, is_hidden, created_at').eq('author_id', profile.id).or(filter).order('created_at', { ascending: false }).limit(50),
    supabase.from('cocktails').select('id, name, is_hidden, created_at').eq('author_id', profile.id).or(filter).order('created_at', { ascending: false }).limit(50),
  ])
  const posts: Post[] = [
    ...(games ?? []).map((g) => ({ ...g, href: `/games/${g.id}`, emoji: '🎲' })),
    ...(cocktails ?? []).map((c) => ({ id: c.id, title: c.name, is_hidden: c.is_hidden, created_at: c.created_at, href: `/cocktails/${c.id}`, emoji: '🍸' })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return { posts, isOwner: user?.id === profile.id }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const name = decodeURIComponent(username)
  const result = await getPosts(name)
  return (
    <>
      <ProfileHeader username={name} />
      <h2 className="text-xl font-bold mb-3">{result?.isOwner ? 'Your posts' : 'Games and cocktails they\u2019ve shared'}</h2>
      {!result ? (
        <ComingSoon />
      ) : result.posts.length === 0 ? (
        <p className="text-text-secondary text-sm">Nothing shared yet.</p>
      ) : (
        <ul className="space-y-3" data-testid="profile-posts">
          {result.posts.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="card card-hover p-4 flex items-center justify-between gap-3">
                <span className="font-semibold">{p.emoji} {p.title}</span>
                {p.is_hidden && <HiddenNotice compact />}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {result?.isOwner && result.posts.some((p) => p.is_hidden) && (
        <p className="text-text-muted text-xs mt-3">🙈 Hidden posts were taken down by a moderator. Only you can see them.</p>
      )}
    </>
  )
}
