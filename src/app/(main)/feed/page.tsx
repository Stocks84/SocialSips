import GameCard from '@/components/games/GameCard'
import GameFilters from '@/components/games/GameFilters'
import FeedMemeCard from '@/components/memes/FeedMemeCard'
import PageHeader from '@/components/ui/PageHeader'
import { listGames } from '@/lib/queries/games'
import { latestMemes } from '@/lib/queries/memes'

export const metadata = { title: 'Feed' }

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ q?: string; hangover?: string; sort?: string }> }) {
  const { q = '', hangover = '', sort = 'newest' } = await searchParams
  // Memes join the default "newest" feed in date order. Search, hangover filter and "top" are about games, so they show games only.
  const withMemes = !q && !hangover && sort !== 'top'
  const [games, memes] = await Promise.all([listGames({ q, hangover, sort }), withMemes ? latestMemes(20) : Promise.resolve([])])
  const items = [
    ...games.map((g) => ({ kind: 'game' as const, at: g.created_at ?? '', g })),
    ...memes.map((m) => ({ kind: 'meme' as const, at: m.created_at, m })),
  ].sort((a, b) => (withMemes ? b.at.localeCompare(a.at) : 0))
  return (
    <>
      <PageHeader emoji="🎮" title="Drinking Games" subtitle="Fresh from the community, rated by hangover." />
      <GameFilters q={q} hangover={hangover} sort={sort} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => it.kind === 'game' ? <GameCard key={`g-${it.g.id}`} {...it.g} /> : <FeedMemeCard key={`m-${it.m.id}`} meme={it.m} />)}
      </div>
      {items.length === 0 && <p className="text-text-secondary">No games match. Try another search or filter.</p>}
    </>
  )
}
