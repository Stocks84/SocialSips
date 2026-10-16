import HangoverPicker from '@/components/games/HangoverPicker'
import PageHeader from '@/components/ui/PageHeader'

export const metadata = { title: 'Add a game' }

export default function NewGamePage() {
  return (
    <>
      <PageHeader emoji="➕" title="Add a game" subtitle="Share the rules. Be honest about the hangover." />
      {/* TODO: Server Action validated with gameSchema → insert into games */}
      <form className="card p-6 space-y-5 max-w-2xl">
        <div>
          <label className="label" htmlFor="title">Game name</label>
          <input id="title" name="title" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="summary">One-line summary</label>
          <input id="summary" name="summary" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="rules">Rules</label>
          <textarea id="rules" name="rules" rows={6} className="input" />
        </div>
        <HangoverPicker />
        <button type="button" className="btn-primary">Publish game</button>
      </form>
    </>
  )
}
