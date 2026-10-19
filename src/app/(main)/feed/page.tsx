import Link from 'next/link'
import GameCard from '@/components/games/GameCard'
import GameFilters from '@/components/games/GameFilters'
import FeedMemeCard from '@/components/memes/FeedMemeCard'
import PageHeader from '@/components/ui/PageHeader'
import ChallengeBanner from '@/components/challenge/ChallengeBanner'
import { followingGames, listGames } from '@/lib/queries/games'
import { followingMemes, latestMemes } from '@/lib/queries/memes'
import { getViewer } from '@/lib/server/viewer'

export const metadata = { title: 'Feed' }

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ q?: string; hangover?: string; sort?: string; tab?: string }> }) {
  const { q = '', hangover = '', sort = 'newest', tab = '' } = await searchParams
  const { userId } = await getViewer()
  const following = tab === 'following'
  // Memes join the default "newest" feed in date order. Search, hangover filter and "top" are about games, so they show games only.
  const withMemes = following || (!q && !hangover && sort !== 'top')
  const [games, memes] = following
    ? (userId ? await Promise.all([followingGames(), followingMemes(20)]) : [[], []])
    : await Promise.all([listGames({ q, hangover, sort }), withMemes ? latestMemes(20) : Promise.resolve([])])
  const items = [
    ...games.map((g) => ({ kind: 'game' as const, at: g.created_at ?? '', g })),
    ...memes.map((m) => ({ kind: 'meme' as const, at: m.created_at, m })),
  ].sort((a, b) => (withMemes ? b.at.localeCompare(a.at) : 0))
  const tabCls = (on: boolean) => `px-4 py-1.5 rounded-full text-sm border ${on ? 'border-accent-purple text-accent-purple font-semibold' : 'border-border text-text-secondary hover:text-accent-cyan'}`
  return (
    <>
      <PageHeader emoji="🎮" title="Drinking Games" subtitle="Fresh from the community, rated by hangover." />
      <ChallengeBanner />
      <nav className="flex gap-2 mb-4" aria-label="Feed" data-testid="feed-tabs">
        <Link href="/feed" className={tabCls(!following)} aria-current={!following ? 'page' : undefined} data-testid="tab-everyone">Everyone</Link>
        <Link href="/feed?tab=following" className={tabCls(following)} aria-current={following ? 'page' : undefined} data-testid="tab-following">Following</Link>
      </nav>
      {!following && <GameFilters q={q} hangover={hangover} sort={sort} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => it.kind === 'game' ? <GameCard key={`g-${it.g.id}`} {...it.g} /> : <FeedMemeCard key={`m-${it.m.id}`} meme={it.m} />)}
      </div>
      {items.length === 0 && (following
        ? <p className="text-text-secondary" data-testid="following-empty">{userId ? 'Nothing here yet. Follow people from their profile to see their games and memes here.' : <><Link href="/sign-in?redirectTo=/feed?tab=following" className="text-accent-purple">Sign in</Link> to see posts from people you follow.</>}</p>
        : <p className="text-text-secondary">No games match. Try another search or filter.</p>)}
    </>
  )
}
