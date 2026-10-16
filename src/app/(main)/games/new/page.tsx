import NewGameForm from '@/components/games/NewGameForm'
import PageHeader from '@/components/ui/PageHeader'

export const metadata = { title: 'Add a game' }

export default function NewGamePage() {
  return (
    <>
      <PageHeader emoji="➕" title="Add a game" subtitle="Share the rules. Be honest about the hangover." />
      <NewGameForm />
    </>
  )
}
