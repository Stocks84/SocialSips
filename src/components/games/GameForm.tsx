'use client'
import { useActionState, useState } from 'react'
import type { FormState } from '@/lib/server/forms'
import { HANGOVER_RATINGS, type HangoverRating } from '@/types/database'
import HangoverPicker from './HangoverPicker'
import ImageInput from '@/components/ui/ImageInput'
import FieldError from '@/components/ui/FieldError'
import LengthHint, { defaultHint, uniqueFieldError } from '@/components/ui/LengthHint'
import { gameFieldsFromForm, listItems } from '@/lib/validators/game'
import { fieldErrors, firstIssue } from '@/lib/validators/issues'

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

const LIMITS = {
  title: { min: 3, max: 80 },
  summary: { min: 10, max: 200 },
  rules: { min: 20, max: 5000 },
  list: 10,
} as const

const HINTS = {
  title: defaultHint(LIMITS.title.min),
  summary: defaultHint(LIMITS.summary.min),
  rules: defaultHint(LIMITS.rules.min),
  minPlayers: 'At least 1',
  maxPlayers: 'Optional. At least the min if set',
  equipment: 'Up to 10 items, comma separated',
  tags: 'Up to 10 items, comma separated',
} as const

/** Fields are controlled so a failed submit (React resets the form after a server action) cannot wipe what was typed. */
export default function GameForm({ action: serverAction, defaults = {}, submitLabel }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(serverAction, {})
  const [title, setTitle] = useState(defaults.title ?? '')
  const [summary, setSummary] = useState(defaults.summary ?? '')
  const [rules, setRules] = useState(defaults.rules ?? '')
  const [minPlayers, setMinPlayers] = useState(String(defaults.min_players ?? 2))
  const [maxPlayers, setMaxPlayers] = useState(defaults.max_players != null ? String(defaults.max_players) : '')
  const [equipment, setEquipment] = useState((defaults.equipment ?? []).join(', '))
  const [tags, setTags] = useState((defaults.tags ?? []).join(', '))
  const [hangover, setHangover] = useState<string>(defaults.hangover_rating ?? HANGOVER_RATINGS[0])
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [clientTop, setClientTop] = useState<string | undefined>()

  const err = (k: string) => clientErrors[k] ?? state.fieldErrors?.[k]
  const topError = clientTop ?? state.error
  const fieldErr = (k: string, hint?: string) => uniqueFieldError(err(k), hint, topError)
  const aria = (k: string) => ({
    'aria-invalid': Boolean(err(k)) || undefined,
    'aria-describedby': [err(k) ? `${k}-error` : null, `${k}-hint`].filter(Boolean).join(' '),
  })

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = gameFieldsFromForm(new FormData(e.currentTarget))
    if (parsed.success) {
      setClientErrors({})
      setClientTop(undefined)
      return
    }
    e.preventDefault()
    const fields = fieldErrors(parsed.error.issues)
    setClientErrors(fields)
    setClientTop(firstIssue(parsed.error.issues))
    const first = (['title', 'summary', 'rules', 'minPlayers', 'maxPlayers', 'equipment', 'tags', 'hangoverRating'] as const).find((k) => fields[k])
    const el = first ? e.currentTarget.querySelector<HTMLElement>(`#${first}`) ?? e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`) : null
    el?.focus()
    document.getElementById('game-form-error')?.scrollIntoView({ block: 'nearest' })
  }

  const minN = Number(minPlayers)
  const maxN = maxPlayers.trim() === '' ? null : Number(maxPlayers)
  const equipmentCount = listItems(equipment).length
  const tagsCount = listItems(tags, true).length

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="card p-6 space-y-5 max-w-2xl" data-testid="game-form">
      {defaults.id && <input type="hidden" name="gameId" value={defaults.id} />}
      {topError && <p id="game-form-error" className="error-msg" role="alert" data-testid="form-error">{topError}</p>}
      <div>
        <label className="label" htmlFor="title">Game name</label>
        <input id="title" name="title" className="input" required minLength={LIMITS.title.min} maxLength={LIMITS.title.max} value={title} onChange={(e) => setTitle(e.target.value)} {...aria('title')} />
        <LengthHint id="title" value={title} min={LIMITS.title.min} max={LIMITS.title.max} hint={HINTS.title} invalid={Boolean(err('title'))} />
        <FieldError id="title" message={fieldErr('title', HINTS.title)} />
      </div>
      <div>
        <label className="label" htmlFor="summary">Short description</label>
        <input id="summary" name="summary" className="input" required minLength={LIMITS.summary.min} maxLength={LIMITS.summary.max} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="One line that sells it" {...aria('summary')} />
        <LengthHint id="summary" value={summary} min={LIMITS.summary.min} max={LIMITS.summary.max} hint={HINTS.summary} invalid={Boolean(err('summary'))} />
        <FieldError id="summary" message={fieldErr('summary', HINTS.summary)} />
      </div>
      <div>
        <label className="label" htmlFor="rules">Rules</label>
        <textarea id="rules" name="rules" rows={7} className="input" required minLength={LIMITS.rules.min} maxLength={LIMITS.rules.max} value={rules} onChange={(e) => setRules(e.target.value)} {...aria('rules')} />
        <LengthHint id="rules" value={rules} min={LIMITS.rules.min} max={LIMITS.rules.max} hint={HINTS.rules} invalid={Boolean(err('rules'))} />
        <FieldError id="rules" message={fieldErr('rules', HINTS.rules)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="minPlayers">Min players</label>
          <input id="minPlayers" name="minPlayers" type="number" min={1} value={minPlayers} onChange={(e) => setMinPlayers(e.target.value)} className="input" required {...aria('minPlayers')} />
          <LengthHint id="minPlayers" hint={HINTS.minPlayers} met={Number.isInteger(minN) && minN >= 1} invalid={Boolean(err('minPlayers'))} />
          <FieldError id="minPlayers" message={fieldErr('minPlayers', HINTS.minPlayers)} />
        </div>
        <div>
          <label className="label" htmlFor="maxPlayers">Max players (optional)</label>
          <input id="maxPlayers" name="maxPlayers" type="number" min={1} value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} className="input" {...aria('maxPlayers')} />
          <LengthHint id="maxPlayers" hint={HINTS.maxPlayers} met={maxN == null || (Number.isInteger(maxN) && maxN >= 1 && maxN >= minN)} invalid={Boolean(err('maxPlayers'))} />
          <FieldError id="maxPlayers" message={fieldErr('maxPlayers', HINTS.maxPlayers)} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="equipment">Equipment (comma separated)</label>
        <input id="equipment" name="equipment" className="input" value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="cups, ping pong ball, cards" {...aria('equipment')} />
        <LengthHint id="equipment" count={equipmentCount} max={LIMITS.list} hint={HINTS.equipment} met={equipmentCount > 0 && equipmentCount <= LIMITS.list} invalid={Boolean(err('equipment'))} />
        <FieldError id="equipment" message={fieldErr('equipment', HINTS.equipment)} />
      </div>
      <div>
        <label className="label" htmlFor="tags">Tags (comma separated)</label>
        <input id="tags" name="tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="party, cards, team" {...aria('tags')} />
        <LengthHint id="tags" count={tagsCount} max={LIMITS.list} hint={HINTS.tags} met={tagsCount > 0 && tagsCount <= LIMITS.list} invalid={Boolean(err('tags'))} />
        <FieldError id="tags" message={fieldErr('tags', HINTS.tags)} />
      </div>
      <HangoverPicker value={hangover} onChange={setHangover} />
      <FieldError id="hangoverRating" message={fieldErr('hangoverRating')} />
      <ImageInput label={defaults.cover_image_url ? 'Replace cover image (optional)' : undefined} />
      <FieldError id="cover" message={fieldErr('cover')} />
      {defaults.cover_image_url && (
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" name="removeCover" value="true" className="accent-accent" /> Remove current cover
        </label>
      )}
      <button className="btn-primary" disabled={pending} data-testid="game-submit">{pending ? 'Saving…' : submitLabel}</button>
    </form>
  )
}
