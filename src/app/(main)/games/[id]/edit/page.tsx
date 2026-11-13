import { notFound, redirect } from 'next/navigation'
import GameForm from '@/components/games/GameForm'
import PageHeader from '@/components/ui/PageHeader'
import { getGameDetail } from '@/lib/queries/games'
import { deleteGame, updateGame } from '../../actions'
import SubmitButton from '@/components/ui/SubmitButton'

export const metadata = { title: 'Edit game' }

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getGameDetail(id)
  if (!detail) notFound()
  if (!detail.userId || detail.game.author_id !== detail.userId) redirect(`/games/${id}`)
  const g = detail.game
  return (
    <>
      <PageHeader title="Edit game" subtitle={g.title} />
      {g.is_hidden ? <p className="card p-4 text-sm text-ink-2 max-w-2xl" data-testid="edit-locked">A moderator has hidden this post, so it can&apos;t be edited right now.</p> : (
        <GameForm
          action={updateGame}
          submitLabel="Save changes"
          defaults={{ ...g, rules: g.rules ?? '' }}
        />
      )}
      <form action={deleteGame} className="card p-6 mt-8 max-w-2xl border-accent">
        <input type="hidden" name="gameId" value={g.id} />
        <h2 className="font-bold text-accent mb-2">Danger zone</h2>
        <p className="text-ink-2 text-sm mb-4">Deletes the game, its cover image, variations, comments and ratings. No undo.</p>
        <label className="flex items-center gap-2 text-sm mb-4">
          <input type="checkbox" required className="accent-accent" /> Yes, delete this game
        </label>
        <SubmitButton className="btn-danger" pendingLabel="Deleting…">Delete game</SubmitButton>
      </form>
    </>
  )
}
