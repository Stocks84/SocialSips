import { notFound, redirect } from 'next/navigation'
import GameForm from '@/components/games/GameForm'
import PageHeader from '@/components/ui/PageHeader'
import { getGameDetail } from '@/lib/queries/games'
import { deleteGame, updateGame } from '../../actions'

export const metadata = { title: 'Edit game' }

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getGameDetail(id)
  if (!detail) notFound()
  if (!detail.userId || detail.game.author_id !== detail.userId) redirect(`/games/${id}`)
  const g = detail.game
  return (
    <>
      <PageHeader emoji="✏️" title="Edit game" subtitle={g.title} />
      {g.is_hidden ? <p className="card-glass p-4 text-sm text-text-secondary max-w-2xl" data-testid="edit-locked">🙈 A moderator has hidden this post, so it can&apos;t be edited right now.</p> : (
        <GameForm
          action={updateGame}
          submitLabel="Save changes"
          defaults={{ ...g, rules: g.rules ?? '' }}
        />
      )}
      <form action={deleteGame} className="card p-6 mt-8 max-w-2xl border-accent-pink/40">
        <input type="hidden" name="gameId" value={g.id} />
        <h2 className="font-bold text-accent-pink mb-2">Danger zone</h2>
        <p className="text-text-secondary text-sm mb-4">Deletes the game, its cover image, variations, comments and ratings. No undo.</p>
        <label className="flex items-center gap-2 text-sm mb-4">
          <input type="checkbox" required className="accent-accent-pink" /> Yes, delete this game
        </label>
        <button className="btn-danger">Delete game</button>
      </form>
    </>
  )
}
