import { notFound } from 'next/navigation'
import HangoverBadge from '@/components/ui/HangoverBadge'
import ComingSoon from '@/components/ui/ComingSoon'
import { mockGames } from '@/lib/mock-data'

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const game = mockGames.find((g) => g.id === id)
  if (!game) notFound()
  return (
    <article className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-4xl font-black mb-3">{game.title}</h1>
        <HangoverBadge rating={game.hangover_rating} />
        <p className="text-text-secondary mt-4">{game.summary}</p>
      </header>
      <section>
        <h2 className="text-xl font-bold mb-3 text-accent-purple">📜 Original rules</h2>
        <ComingSoon>Full rules load from Supabase.</ComingSoon>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-accent-cyan">🔀 House variations</h2>
        <ComingSoon>Users can add their own twists here.</ComingSoon>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-3 text-accent-pink">💬 Comments &amp; ratings</h2>
        <ComingSoon />
      </section>
    </article>
  )
}
