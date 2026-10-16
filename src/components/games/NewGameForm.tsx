'use client'
import { useActionState } from 'react'
import { createGame, type FormState } from '@/app/(main)/games/actions'
import HangoverPicker from './HangoverPicker'

export default function NewGameForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createGame, {})
  return (
    <form action={action} className="card p-6 space-y-5 max-w-2xl">
      <div>
        <label className="label" htmlFor="title">Game name</label>
        <input id="title" name="title" className="input" required minLength={3} maxLength={80} />
      </div>
      <div>
        <label className="label" htmlFor="summary">Short description</label>
        <input id="summary" name="summary" className="input" required minLength={10} maxLength={200} placeholder="One line that sells it" />
      </div>
      <div>
        <label className="label" htmlFor="rules">Rules</label>
        <textarea id="rules" name="rules" rows={7} className="input" required minLength={20} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="minPlayers">Min players</label>
          <input id="minPlayers" name="minPlayers" type="number" min={1} defaultValue={2} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="maxPlayers">Max players (optional)</label>
          <input id="maxPlayers" name="maxPlayers" type="number" min={1} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="equipment">Equipment (comma separated)</label>
        <input id="equipment" name="equipment" className="input" placeholder="cups, ping pong ball, cards" />
      </div>
      <div>
        <label className="label" htmlFor="tags">Tags (comma separated)</label>
        <input id="tags" name="tags" className="input" placeholder="party, cards, team" />
      </div>
      <HangoverPicker />
      <div>
        <label className="label" htmlFor="cover">Cover image (optional, max 4 MB)</label>
        <input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
      </div>
      {state.error && <p className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? 'Publishing…' : 'Publish game 🚀'}</button>
    </form>
  )
}
