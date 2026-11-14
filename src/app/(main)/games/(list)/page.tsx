import Link from 'next/link'
import GameCard from '@/components/games/GameCard'
import GameFilters from '@/components/games/GameFilters'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import Pager from '@/components/ui/Pager'
import { listGames } from '@/lib/queries/games'
import { encodeCursor, parseCursor, PAGE_SIZE, PAGE_TAKE } from '@/lib/paging'

export const metadata = { title: 'Games' }

type SP = { q?: string; hangover?: string; sort?: string; page?: string; before?: string }

export default async function GamesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { q = '', hangover = '', sort = 'newest', page: pageParam, before: beforeParam } = await searchParams
  const top = sort === 'top'
  const before = top ? null : parseCursor(beforeParam)
  const page = top ? Math.max(1, Number(pageParam) || 1) : 1
  const rows = await listGames({ q, hangover, sort, before, offset: (page - 1) * PAGE_SIZE, limit: PAGE_TAKE })
  const games = rows.slice(0, PAGE_SIZE)
  const hasMore = rows.length > PAGE_SIZE
  const last = games[games.length - 1]
  const href = (p: { page?: number; before?: string } = {}) => {
    const s = new URLSearchParams()
    if (q) s.set('q', q)
    if (hangover) s.set('hangover', hangover)
    if (sort !== 'newest') s.set('sort', sort)
    if (p.page && p.page > 1) s.set('page', String(p.page))
    if (p.before) s.set('before', p.before)
    const qs = s.toString()
    return qs ? `/games?${qs}` : '/games'
  }
  const filtered = Boolean(q || hangover)
  const paged = Boolean(before) || page > 1
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Drinking Games" subtitle="Browse every game. Search, filter by hangover, or sort by rating." />
        <Link href="/games/new" className="btn-primary text-sm shrink-0 text-center">+ Share a game</Link>
      </div>
      <GameFilters q={q} hangover={hangover} sort={sort} action="/games" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="games-items">
        {games.map((g) => <GameCard key={g.id} {...g} />)}
      </div>
      {games.length === 0 && (
        paged ? (
          <EmptyState title="That's every game." action={{ href: href(), label: 'Back to the start' }} testId="games-end">
            You&apos;ve paged past the lot. Impressive stamina.
          </EmptyState>
        ) : filtered ? (
          <EmptyState title="No games match that." action={{ href: '/games', label: 'Clear filters' }} testId="games-empty">
            Try another search or hangover level. Or invent the game yourself.
          </EmptyState>
        ) : (
          <EmptyState title="The party hasn't started yet." action={{ href: '/games/new', label: '+ Share a game' }} testId="games-empty">
            Nothing to play here so far. Be the legend who posts the first game.
          </EmptyState>
        )
      )}
      {top ? (
        <Pager
          label="More games"
          prevHref={page > 1 ? href({ page: page - 1 }) : null}
          prevText="← Previous"
          nextHref={hasMore ? href({ page: page + 1 }) : null}
          nextText="Load more →"
          testId="games-pager"
        />
      ) : (
        <Pager
          label="More games"
          prevHref={before ? href() : null}
          prevText="↑ Back to the newest"
          nextHref={hasMore && last?.created_at ? href({ before: encodeCursor({ at: last.created_at, id: last.id }) }) : null}
          nextText="Load more →"
          testId="games-pager"
        />
      )}
    </>
  )
}
