'use client'
import { useActionState } from 'react'
import type { FormState } from '@/lib/server/forms'
import type { HangoverRating } from '@/types/database'
import HangoverPicker from './HangoverPicker'
import ImageInput from '@/components/ui/ImageInput'
import FieldError from '@/components/ui/FieldError'

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
  // After a failed submit React resets the form, so refill it from what the user typed.
  const val = (k: string, d?: string | number | null) => { const v = state.values?.[k]; return typeof v === 'string' ? v : (d ?? undefined) ?? undefined }
  const err = (k: string) => state.fieldErrors?.[k]
  const aria = (k: string) => (err(k) ? { 'aria-invalid': true, 'aria-describedby': `${k}-error` } : {})
  return (
    <form action={action} className="card p-6 space-y-5 max-w-2xl">
      {defaults.id && <input type="hidden" name="gameId" value={defaults.id} />}
      <div>
        <label className="label" htmlFor="title">Game name</label>
        <input id="title" name="title" className="input" required minLength={3} maxLength={80} defaultValue={val('title', defaults.title)} {...aria('title')} />
        <FieldError id="title" message={err('title')} />
      </div>
      <div>
        <label className="label" htmlFor="summary">Short description</label>
        <input id="summary" name="summary" className="input" required minLength={10} maxLength={200} defaultValue={val('summary', defaults.summary)} placeholder="One line that sells it" {...aria('summary')} />
        <FieldError id="summary" message={err('summary')} />
      </div>
      <div>
        <label className="label" htmlFor="rules">Rules</label>
        <textarea id="rules" name="rules" rows={7} className="input" required maxLength={5000} minLength={20} defaultValue={val('rules', defaults.rules)} {...aria('rules')} />
        <FieldError id="rules" message={err('rules')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="minPlayers">Min players</label>
          <input id="minPlayers" name="minPlayers" type="number" min={1} defaultValue={val('minPlayers', defaults.min_players ?? 2)} className="input" required {...aria('minPlayers')} />
          <FieldError id="minPlayers" message={err('minPlayers')} />
        </div>
        <div>
          <label className="label" htmlFor="maxPlayers">Max players (optional)</label>
          <input id="maxPlayers" name="maxPlayers" type="number" min={1} defaultValue={val('maxPlayers', defaults.max_players)} className="input" {...aria('maxPlayers')} />
          <FieldError id="maxPlayers" message={err('maxPlayers')} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="equipment">Equipment (comma separated)</label>
        <input id="equipment" name="equipment" className="input" defaultValue={val('equipment', defaults.equipment?.join(', '))} placeholder="cups, ping pong ball, cards" />
        <FieldError id="equipment" message={err('equipment')} />
      </div>
      <div>
        <label className="label" htmlFor="tags">Tags (comma separated)</label>
        <input id="tags" name="tags" className="input" defaultValue={val('tags', defaults.tags?.join(', '))} placeholder="party, cards, team" />
        <FieldError id="tags" message={err('tags')} />
      </div>
      <HangoverPicker defaultValue={(val('hangoverRating', defaults.hangover_rating) as HangoverRating | undefined)} />
      <FieldError id="hangoverRating" message={err('hangoverRating')} />
      <ImageInput label={defaults.cover_image_url ? 'Replace cover image (optional)' : undefined} />
      <FieldError id="cover" message={err('cover')} />
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
