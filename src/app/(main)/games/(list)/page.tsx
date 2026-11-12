import Link from 'next/link'
import GameCard from '@/components/games/GameCard'
import GameFilters from '@/components/games/GameFilters'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import Pager from '@/components/ui/Pager'
import { listGames } from '@/lib/queries/games'
import { PAGE_SIZE, RPC_MAX_ROWS } from '@/lib/paging'

export const metadata = { title: 'Games' }

type SP = { q?: string; hangover?: string; sort?: string; page?: string }

export default async function GamesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { q = '', hangover = '', sort = 'newest', page: pageParam } = await searchParams
  const maxPage = Math.ceil(RPC_MAX_ROWS / PAGE_SIZE) // feed_games caps at 100 rows
  const page = Math.max(1, Math.min(maxPage, Number(pageParam) || 1))
  const rows = await listGames({ q, hangover, sort, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE + 1 })
  const games = rows.slice(0, PAGE_SIZE)
  const hasMore = rows.length > PAGE_SIZE && page < maxPage
  const href = (p: number) => {
    const s = new URLSearchParams()
    if (q) s.set('q', q)
    if (hangover) s.set('hangover', hangover)
    if (sort !== 'newest') s.set('sort', sort)
    if (p > 1) s.set('page', String(p))
    const qs = s.toString()
    return qs ? `/games?${qs}` : '/games'
  }
  const filtered = Boolean(q || hangover)
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader emoji="🎮" title="Drinking Games" subtitle="Browse every game. Search, filter by hangover, or sort by rating." />
        <Link href="/games/new" className="btn-primary text-sm shrink-0 text-center">+ Share a game</Link>
      </div>
      <GameFilters q={q} hangover={hangover} sort={sort} action="/games" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="games-items">
        {games.map((g) => <GameCard key={g.id} {...g} />)}
      </div>
      {games.length === 0 && (
        page > 1 ? (
          <EmptyState emoji="🍺" title="That's every game." action={{ href: href(1), label: 'Back to the start' }} testId="games-end">
            You&apos;ve paged past the lot. Impressive stamina.
          </EmptyState>
        ) : filtered ? (
          <EmptyState emoji="🔍" title="No games match that." action={{ href: '/games', label: 'Clear filters' }} testId="games-empty">
            Try another search or hangover level. Or invent the game yourself.
          </EmptyState>
        ) : (
          <EmptyState emoji="🎲" title="The party hasn't started yet." action={{ href: '/games/new', label: '+ Share a game' }} testId="games-empty">
            Nothing to play here so far. Be the legend who posts the first game.
          </EmptyState>
        )
      )}
      <Pager
        label="More games"
        prevHref={page > 1 ? href(page - 1) : null}
        prevText={sort === 'top' ? '← Previous' : '← Newer'}
        nextHref={hasMore ? href(page + 1) : null}
        nextText={sort === 'top' ? 'More →' : 'Older →'}
        testId="games-pager"
      />
    </>
  )
}
