import GameCard from '@/components/games/GameCard'
import GameFilters from '@/components/games/GameFilters'
import PageHeader from '@/components/ui/PageHeader'
import { mockGames } from '@/lib/mock-data'

export const metadata = { title: 'Feed' }

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ q?: string; hangover?: string }> }) {
  const { q = '', hangover = '' } = await searchParams
  // TODO: replace mock data with a Supabase query (ilike on title, eq on hangover_rating)
  const games = mockGames.filter(
    (g) => (!q || g.title.toLowerCase().includes(q.toLowerCase())) && (!hangover || g.hangover_rating === hangover),
  )
  return (
    <>
      <PageHeader emoji="🎮" title="Drinking Games" subtitle="Fresh from the community, rated by hangover." />
      <GameFilters q={q} hangover={hangover} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => <GameCard key={g.id} {...g} />)}
      </div>
      {games.length === 0 && <p className="text-text-secondary">No games match. Try another filter.</p>}
    </>
  )
}
