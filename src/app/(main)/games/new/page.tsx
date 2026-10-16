import GameForm from '@/components/games/GameForm'
import PageHeader from '@/components/ui/PageHeader'
import { createGame } from '../actions'

export const metadata = { title: 'Add a game' }

export default function NewGamePage() {
  return (
    <>
      <PageHeader emoji="➕" title="Add a game" subtitle="Share the rules. Be honest about the hangover." />
      <GameForm action={createGame} submitLabel="Publish game 🚀" />
    </>
  )
}
