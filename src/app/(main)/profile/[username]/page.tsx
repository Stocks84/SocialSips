import Link from 'next/link'
import { NoticeBody, type Notice } from '@/components/moderation/StatementOfReasons'
import { setBlock } from '../../settings/actions'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getViewer } from '@/lib/server/viewer'
import ProfileHeader from '@/components/profile/ProfileHeader'
import SavedBanner from '@/components/ui/SavedBanner'
import ComingSoon from '@/components/ui/ComingSoon'
import HiddenNotice from '@/components/ui/HiddenNotice'
import { createClient } from '@/lib/supabase/server'
import { visibleTo } from '@/lib/queries/visibility'
import { REACTIONS } from '@/lib/memes'

type Post = { id: string; title: string; is_hidden: boolean; created_at: string; href: string; emoji: string }

/** Games + cocktails a user shared. The owner also sees their hidden ones (badged); RLS hides them from everyone else. */
/** The profile row, fetched once per request. Null when the username doesn't exist. */
const getProfile = cache(async (username: string) => {
  const supabase = await createClient()
  if (!supabase) return null
  const { data } = await supabase.from('profiles').select('id, username, display_name, bio, avatar_url').eq('username', username).maybeSingle()
  return data
})

async function getPosts(profile: { id: string }): Promise<{ posts: Post[]; isOwner: boolean } | null> {
  const supabase = await createClient()
  if (!supabase) return null
  const { userId } = await getViewer()
  const user = userId ? { id: userId } : null
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

/** Reactions received on the user's visible memes, by emoji. */
async function getReactionTotals(profile: { id: string }): Promise<Record<string, number> | null> {
  const supabase = await createClient()
  if (!supabase) return null
  const { data, error } = await supabase.rpc('profile_reaction_totals', { p_user: profile.id })
  if (error) { console.error('profile_reaction_totals', error.message); return null }
  return Object.fromEntries(((data ?? []) as { emoji: string; n: number }[]).map((r) => [r.emoji, Number(r.n)]))
}

export default async function ProfilePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { username } = await params
  const { saved } = await searchParams
  let name = username
  try { name = decodeURIComponent(username) } catch { /* already decoded */ }
  const supabase = await createClient()
  const profile = supabase ? await getProfile(name) : null
  if (supabase && !profile) notFound() // unknown usernames get a real 404, not a made-up profile
  const [result, totals] = profile ? await Promise.all([getPosts(profile), getReactionTotals(profile)]) : [null, null]
  const { userId: viewerId } = await getViewer()
  const canBlock = Boolean(supabase && profile && viewerId && viewerId !== profile.id)
  const [blocking, notices] = await Promise.all([
    canBlock ? supabase!.from('blocks').select('blocked_id').eq('blocker_id', viewerId!).eq('blocked_id', profile!.id).maybeSingle().then((r) => Boolean(r.data)) : false,
    result?.isOwner ? supabase!.from('moderation_notices').select('id, target_type, target_id, reason, explanation, preview, created_at, reversed_at').eq('author_id', profile!.id).order('created_at', { ascending: false }).limit(20).then((r) => (r.data ?? []) as Notice[]) : [],
  ])
  const totalReactions = totals ? Object.values(totals).reduce((a, b) => a + b, 0) : 0
  return (
    <>
      <SavedBanner show={saved === '1'} />
      <ProfileHeader username={profile?.username ?? name} displayName={profile?.display_name} bio={profile?.bio} avatarUrl={profile?.avatar_url} isOwner={Boolean(result?.isOwner)} />
      {canBlock && (
        <form action={setBlock} className="mb-6 flex flex-wrap items-center gap-3" data-testid="block-form">
          <input type="hidden" name="userId" value={profile!.id} />
          <input type="hidden" name="back" value={`/profile/${profile!.username}`} />
          <input type="hidden" name="block" value={blocking ? '0' : '1'} />
          {blocking && <span className="text-sm text-text-secondary" data-testid="blocked-note">🚫 You&apos;ve blocked @{profile!.username}. You won&apos;t see their posts or comments, and they can&apos;t comment on yours.</span>}
          <button className="btn-secondary text-sm py-1.5 px-3" data-testid={blocking ? 'unblock-btn' : 'block-btn'}>{blocking ? 'Unblock' : '🚫 Block'}</button>
        </form>
      )}
      {totals && (
        <section className="card p-5 mb-8" data-testid="reaction-totals">
          <h2 className="font-bold mb-3">😂 Meme reactions received <span className="text-text-muted text-sm font-normal">({totalReactions})</span></h2>
          <ul className="flex flex-wrap gap-2">
            {REACTIONS.map((e) => (
              <li key={e} className="px-3 py-1 rounded-full border border-border text-sm" aria-label={`${e} ${totals[e] ?? 0}`} data-testid="reaction-total">
                {e} <span className="text-text-secondary">{totals[e] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
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
      {notices.length > 0 && (
        <section className="mt-8" data-testid="moderation-notices">
          <h2 className="text-xl font-bold mb-3">🛡️ Moderation notices</h2>
          <p className="text-text-muted text-xs mb-3">Only you can see these.</p>
          <ul className="space-y-3">{notices.map((n) => <li key={n.id} className="card p-4"><NoticeBody n={n} /></li>)}</ul>
        </section>
      )}
    </>
  )
}
