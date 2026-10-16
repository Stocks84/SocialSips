'use client'
import { useActionState } from 'react'
import type { FormState } from '@/app/(main)/games/actions'
import type { HangoverRating } from '@/types/database'
import HangoverPicker from './HangoverPicker'
import CoverInput from './CoverInput'

export type GameFormDefaults = {
  id?: string
  title?: string
  summary?: string
  rules?: string
  min_players?: number
  max_players?: number | null
  equipment?: string[]
  tags?: string[]
  hangover_rating?: HangoverRating
  cover_image_url?: string | null
}

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>
  defaults?: GameFormDefaults
  submitLabel: string
}

/** Shared create/edit form for games. */
export default function GameForm({ action: serverAction, defaults = {}, submitLabel }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(serverAction, {})
  return (
    <form action={action} className="card p-6 space-y-5 max-w-2xl">
      {defaults.id && <input type="hidden" name="gameId" value={defaults.id} />}
      <div>
        <label className="label" htmlFor="title">Game name</label>
        <input id="title" name="title" className="input" required minLength={3} maxLength={80} defaultValue={defaults.title} />
      </div>
      <div>
        <label className="label" htmlFor="summary">Short description</label>
        <input id="summary" name="summary" className="input" required minLength={10} maxLength={200} defaultValue={defaults.summary} placeholder="One line that sells it" />
      </div>
      <div>
        <label className="label" htmlFor="rules">Rules</label>
        <textarea id="rules" name="rules" rows={7} className="input" required minLength={20} defaultValue={defaults.rules} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="minPlayers">Min players</label>
          <input id="minPlayers" name="minPlayers" type="number" min={1} defaultValue={defaults.min_players ?? 2} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="maxPlayers">Max players (optional)</label>
          <input id="maxPlayers" name="maxPlayers" type="number" min={1} defaultValue={defaults.max_players ?? undefined} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="equipment">Equipment (comma separated)</label>
        <input id="equipment" name="equipment" className="input" defaultValue={defaults.equipment?.join(', ')} placeholder="cups, ping pong ball, cards" />
      </div>
      <div>
        <label className="label" htmlFor="tags">Tags (comma separated)</label>
        <input id="tags" name="tags" className="input" defaultValue={defaults.tags?.join(', ')} placeholder="party, cards, team" />
      </div>
      <HangoverPicker defaultValue={defaults.hangover_rating} />
      <CoverInput label={defaults.cover_image_url ? 'Replace cover image (optional)' : undefined} />
      {defaults.cover_image_url && (
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" name="removeCover" value="true" className="accent-accent-pink" /> Remove current cover
        </label>
      )}
      {state.error && <p className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? 'Saving…' : submitLabel}</button>
    </form>
  )
}
