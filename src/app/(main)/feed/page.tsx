import GameCard from '@/components/games/GameCard'
import GameFilters from '@/components/games/GameFilters'
import PageHeader from '@/components/ui/PageHeader'
import { listGames } from '@/lib/queries/games'

export const metadata = { title: 'Feed' }

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ q?: string; hangover?: string; sort?: string }> }) {
  const { q = '', hangover = '', sort = 'newest' } = await searchParams
  const games = await listGames({ q, hangover, sort })
  return (
    <>
      <PageHeader emoji="🎮" title="Drinking Games" subtitle="Fresh from the community, rated by hangover." />
      <GameFilters q={q} hangover={hangover} sort={sort} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => <GameCard key={g.id} {...g} />)}
      </div>
      {games.length === 0 && <p className="text-text-secondary">No games match. Try another search or filter.</p>}
    </>
  )
}
