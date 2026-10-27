import Link from 'next/link'
import { NoticeBody } from '@/components/moderation/StatementOfReasons'
import { setBlock } from '../../settings/actions'
import { getUserWins } from '@/lib/queries/challenges'
import { getFollowCounts, isFollowing } from '@/lib/queries/follows'
import {
  getProfileByUsername,
  getProfilePosts,
  getProfileReactionTotals,
  isBlocking,
  listModerationNotices,
} from '@/lib/queries/profile'
import FollowButton from '@/components/social/FollowButton'
import { notFound } from 'next/navigation'
import { getViewer } from '@/lib/server/viewer'
import ProfileHeader from '@/components/profile/ProfileHeader'
import SavedBanner from '@/components/ui/SavedBanner'
import ComingSoon from '@/components/ui/ComingSoon'
import HiddenNotice from '@/components/ui/HiddenNotice'
import { createClient } from '@/lib/supabase/server'
import { REACTIONS } from '@/lib/memes'

export default async function ProfilePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ saved?: string; followError?: string }> }) {
  const { username } = await params
  const { saved, followError } = await searchParams
  let name = username
  try { name = decodeURIComponent(username) } catch { /* already decoded */ }
  const supabase = await createClient()
  const profile = supabase ? await getProfileByUsername(name) : null
  if (supabase && !profile) notFound() // unknown usernames get a real 404, not a made-up profile
  const [result, totals] = profile ? await Promise.all([getProfilePosts(profile.id), getProfileReactionTotals(profile.id)]) : [null, null]
  const { userId: viewerId } = await getViewer()
  const canBlock = Boolean(supabase && profile && viewerId && viewerId !== profile.id)
  const [wins, counts, following] = profile ? await Promise.all([getUserWins(profile.id), getFollowCounts(profile.id), viewerId && viewerId !== profile.id ? isFollowing(viewerId, profile.id) : Promise.resolve(false)]) : [[], { followers: 0, following: 0 }, false]
  const [blocking, notices] = await Promise.all([
    canBlock ? isBlocking(viewerId!, profile!.id) : false,
    result?.isOwner ? listModerationNotices(profile!.id) : [],
  ])
  const totalReactions = totals ? Object.values(totals).reduce((a, b) => a + b, 0) : 0
  return (
    <>
      <SavedBanner show={saved === '1'} />
      <ProfileHeader username={profile?.username ?? name} displayName={profile?.display_name} bio={profile?.bio} avatarUrl={profile?.avatar_url} isOwner={Boolean(result?.isOwner)} />
      {profile && (
        <section className="mb-6 flex flex-wrap items-center gap-4 text-sm" data-testid="follow-bar">
          <Link href={`/profile/${profile.username}/followers`} className="hover:text-accent-cyan" data-testid="followers-link"><strong data-testid="followers-count">{counts.followers}</strong> follower{counts.followers === 1 ? '' : 's'}</Link>
          <Link href={`/profile/${profile.username}/following`} className="hover:text-accent-cyan" data-testid="following-link"><strong data-testid="following-count">{counts.following}</strong> following</Link>
          {canBlock && !blocking && <FollowButton userId={profile.id} username={profile.username} following={following} />}
          {followError && <span role="alert" className="text-red-400" data-testid="follow-error">{followError.slice(0, 120)}</span>}
        </section>
      )}
      {canBlock && (
        <form action={setBlock} className="mb-6 flex flex-wrap items-center gap-3" data-testid="block-form">
          <input type="hidden" name="userId" value={profile!.id} />
          <input type="hidden" name="back" value={`/profile/${profile!.username}`} />
          <input type="hidden" name="block" value={blocking ? '0' : '1'} />
          {blocking && <span className="text-sm text-text-secondary" data-testid="blocked-note">🚫 You&apos;ve blocked @{profile!.username}. You won&apos;t see their posts or comments, and they can&apos;t comment on yours.</span>}
          <button className="btn-secondary text-sm py-1.5 px-3" data-testid={blocking ? 'unblock-btn' : 'block-btn'}>{blocking ? 'Unblock' : '🚫 Block'}</button>
        </form>
      )}
      {wins.length > 0 && (
        <section className="mb-6 flex flex-wrap gap-2" data-testid="challenge-wins">
          {wins.map((w) => <Link key={w.challenge_id} href={`/challenge/${w.challenge_id}`} className="badge badge-purple" data-testid="win-badge">🏆 Winner · {w.theme}</Link>)}
        </section>
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
