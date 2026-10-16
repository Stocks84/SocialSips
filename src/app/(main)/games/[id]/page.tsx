import { notFound } from 'next/navigation'
import HangoverBadge from '@/components/ui/HangoverBadge'
import ComingSoon from '@/components/ui/ComingSoon'
import { getGame } from '@/lib/queries/games'

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const game = await getGame(id)
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
        {game.rules ? <p className="card p-5 whitespace-pre-line">{game.rules}</p> : <ComingSoon>Full rules load from Supabase.</ComingSoon>}
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
