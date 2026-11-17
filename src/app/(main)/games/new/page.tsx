import GameForm from '@/components/games/GameForm'
import PageHeader from '@/components/ui/PageHeader'
import SuspendedFormBlock from '@/components/ui/SuspendedFormBlock'
import { getViewer } from '@/lib/server/viewer'
import { createGame } from '../actions'

export const metadata = { title: 'Add a game' }

export default async function NewGamePage() {
  const { suspended } = await getViewer()
  return (
    <>
      <PageHeader title="Add a game" subtitle="Share the rules. Be honest about the hangover." />
      {suspended ? <SuspendedFormBlock action="add a game" reason={suspended.reason} /> : (
        <GameForm action={createGame} submitLabel="Publish game" />
      )}
    </>
  )
}
