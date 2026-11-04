import Link from 'next/link'
import GameCard from '@/components/games/GameCard'
import GameFilters from '@/components/games/GameFilters'
import FeedMemeCard from '@/components/memes/FeedMemeCard'
import PageHeader from '@/components/ui/PageHeader'
import Pager from '@/components/ui/Pager'
import ChallengeBanner from '@/components/challenge/ChallengeBanner'
import { followingGames, listGames } from '@/lib/queries/games'
import { encodeCursor, newestFirst, parseCursor, PAGE_SIZE, RPC_MAX_ROWS } from '@/lib/paging'
import { followingMemes, latestMemes } from '@/lib/queries/memes'
import { getViewer } from '@/lib/server/viewer'

export const metadata = { title: 'Feed' }

type SP = { q?: string; hangover?: string; sort?: string; tab?: string; page?: string; before?: string }

export default async function FeedPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { q = '', hangover = '', sort = 'newest', tab = '', ...sp } = await searchParams
  const { userId } = await getViewer()
  const following = tab === 'following'
  // Memes join the default "newest" feed in date order. Search, hangover filter and "top" are about games, so they show games only.
  const withMemes = following || (!q && !hangover && sort !== 'top')
  // Mixed games + memes page by a (created_at, id) cursor (?before=); games-only views page by number (?page=).
  const before = withMemes ? parseCursor(sp.before) : null
  const maxPage = Math.ceil(RPC_MAX_ROWS / PAGE_SIZE)
  const page = withMemes ? 1 : Math.max(1, Math.min(maxPage, Number(sp.page) || 1))
  const take = PAGE_SIZE + 1 // one extra row = "is there more?"
  const [games, memes] = following
    ? (userId ? await Promise.all([followingGames({ limit: take, before }), followingMemes(take, before)]) : [[], []])
    : await Promise.all([
      listGames({ q, hangover, sort, before, offset: (page - 1) * PAGE_SIZE, limit: take }),
      withMemes ? latestMemes(take, before) : Promise.resolve([]),
    ])
  const merged = [
    ...games.map((g) => ({ kind: 'game' as const, at: g.created_at ?? '', id: g.id, g })),
    ...memes.map((m) => ({ kind: 'meme' as const, at: m.created_at, id: m.id, m })),
  ].sort((a, b) => (withMemes ? newestFirst(a, b) : 0))
  const items = merged.slice(0, PAGE_SIZE)
  const hasMore = merged.length > PAGE_SIZE && (withMemes || page < maxPage)
  const paged = Boolean(before) || page > 1

  const href = (p: { page?: number; before?: string } = {}) => {
    const s = new URLSearchParams()
    if (following) s.set('tab', 'following')
    if (!following) {
      if (q) s.set('q', q)
      if (hangover) s.set('hangover', hangover)
      if (sort !== 'newest') s.set('sort', sort)
    }
    if (p.page && p.page > 1) s.set('page', String(p.page))
    if (p.before) s.set('before', p.before)
    const qs = s.toString()
    return qs ? `/feed?${qs}` : '/feed'
  }
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="feed-items">
        {items.map((it) => it.kind === 'game' ? <GameCard key={`g-${it.g.id}`} {...it.g} /> : <FeedMemeCard key={`m-${it.m.id}`} meme={it.m} />)}
      </div>
      {items.length === 0 && (paged
        ? <p className="text-text-secondary">That&apos;s the bottom of the barrel. <Link href={href()} className="text-accent-purple">Back to the newest →</Link></p>
        : following
          ? <p className="text-text-secondary" data-testid="following-empty">{userId ? 'Nothing here yet. Follow people from their profile to see their games and memes here.' : <><Link href="/sign-in?redirectTo=/feed?tab=following" className="text-accent-purple">Sign in</Link> to see posts from people you follow.</>}</p>
          : <p className="text-text-secondary">No games match. Try another search or filter.</p>)}
      {withMemes ? (
        <Pager
          label="More of the feed"
          prevHref={before ? href() : null}
          prevText="↑ Back to the newest"
          nextHref={hasMore && items.length ? href({ before: encodeCursor(items[items.length - 1]) }) : null}
          nextText="Load older →"
          testId="feed-pager"
        />
      ) : (
        <Pager
          label="More games"
          prevHref={page > 1 ? href({ page: page - 1 }) : null}
          prevText={sort === 'top' ? '← Previous' : '← Newer'}
          nextHref={hasMore ? href({ page: page + 1 }) : null}
          nextText={sort === 'top' ? 'More →' : 'Older →'}
          testId="feed-pager"
        />
      )}
    </>
  )
}
