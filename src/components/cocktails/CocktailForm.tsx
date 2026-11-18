'use client'
import { useActionState, useState } from 'react'
import ImageInput from '@/components/ui/ImageInput'
import IngredientRows, { type IngredientRow } from './IngredientRows'
import FieldError from '@/components/ui/FieldError'
import LengthHint, { defaultHint, uniqueFieldError } from '@/components/ui/LengthHint'
import { cocktailFieldsFromForm } from '@/lib/validators/cocktail'
import { fieldErrors, firstIssue, type EditState } from '@/lib/validators/issues'
export type CocktailFormDefaults = {
  id?: string
  name?: string
  description?: string
  ingredients?: { amount: string; item: string }[]
  method?: string
  is_alcohol_free?: boolean
  image_url?: string | null
}

type Props = {
  action: (prev: EditState, fd: FormData) => Promise<EditState>
  defaults?: CocktailFormDefaults
  submitLabel: string
}

const LIMITS = {
  name: { min: 2, max: 80 },
  description: { min: 10, max: 300 },
  method: { min: 10, max: 3000 },
  ingredients: { min: 1, max: 20 },
} as const

const HINTS = {
  name: defaultHint(LIMITS.name.min),
  description: defaultHint(LIMITS.description.min),
  method: defaultHint(LIMITS.method.min),
  ingredients: defaultHint(LIMITS.ingredients.min, 'ingredient'),
} as const

/** Fields are controlled so a failed submit (React resets the form after a server action) cannot wipe what was typed. */
export default function CocktailForm({ action: serverAction, defaults = {}, submitLabel }: Props) {
  const [state, action, pending] = useActionState<EditState, FormData>(serverAction, {})
  const [name, setName] = useState(defaults.name ?? '')
  const [description, setDescription] = useState(defaults.description ?? '')
  const [method, setMethod] = useState(defaults.method ?? '')
  const [alcoholFree, setAlcoholFree] = useState(Boolean(defaults.is_alcohol_free))
  const [rows, setRows] = useState<IngredientRow[]>(defaults.ingredients?.length ? defaults.ingredients : [{ amount: '', item: '' }])
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [clientTop, setClientTop] = useState<string | undefined>()

  const err = (k: string) => clientErrors[k] ?? state.fieldErrors?.[k]
  const topError = clientTop ?? state.error
  const aria = (k: string) => ({
    'aria-invalid': Boolean(err(k)) || undefined,
    'aria-describedby': [err(k) ? `${k}-error` : null, `${k}-hint`].filter(Boolean).join(' '),
  })

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = cocktailFieldsFromForm(new FormData(e.currentTarget))
    if (parsed.success) {
      setClientErrors({})
      setClientTop(undefined)
      return
    }
    e.preventDefault()
    const fields = fieldErrors(parsed.error.issues)
    setClientErrors(fields)
    setClientTop(firstIssue(parsed.error.issues))
    const first = (['name', 'description', 'ingredients', 'method'] as const).find((k) => fields[k])
    const el = first === 'ingredients'
      ? e.currentTarget.querySelector<HTMLElement>('input[name="ingredientItem"]')
      : first
        ? e.currentTarget.querySelector<HTMLElement>(`#${first}`)
        : null
    el?.focus()
    document.getElementById('drink-form-error')?.scrollIntoView({ block: 'nearest' })
  }

  const filledIngredients = rows.filter((r) => r.item.trim()).length

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="card p-6 space-y-5 max-w-2xl" data-testid="drink-form">
      {defaults.id && <input type="hidden" name="cocktailId" value={defaults.id} />}
      {topError && <p id="drink-form-error" className="error-msg" role="alert" data-testid="form-error">{topError}</p>}
      <div>
        <label className="label" htmlFor="name">Drink name</label>
        <input id="name" name="name" className="input" required minLength={LIMITS.name.min} maxLength={LIMITS.name.max} value={name} onChange={(e) => setName(e.target.value)} {...aria('name')} />
        <LengthHint id="name" value={name} min={LIMITS.name.min} max={LIMITS.name.max} hint={HINTS.name} invalid={Boolean(err('name'))} />
        <FieldError id="name" message={uniqueFieldError(err('name'), HINTS.name, topError)} />
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <input id="description" name="description" className="input" required minLength={LIMITS.description.min} maxLength={LIMITS.description.max} value={description} onChange={(e) => setDescription(e.target.value)} {...aria('description')} />
        <LengthHint id="description" value={description} min={LIMITS.description.min} max={LIMITS.description.max} hint={HINTS.description} invalid={Boolean(err('description'))} />
        <FieldError id="description" message={uniqueFieldError(err('description'), HINTS.description, topError)} />
      </div>
      <IngredientRows rows={rows} onChange={setRows} />
      <LengthHint id="ingredients" count={filledIngredients} min={LIMITS.ingredients.min} max={LIMITS.ingredients.max} unit="ingredient" hint={HINTS.ingredients} invalid={Boolean(err('ingredients'))} />
      <FieldError id="ingredients" message={uniqueFieldError(err('ingredients'), HINTS.ingredients, topError)} />
      <div>
        <label className="label" htmlFor="method">Method</label>
        <textarea id="method" name="method" rows={5} className="input" required minLength={LIMITS.method.min} maxLength={LIMITS.method.max} value={method} onChange={(e) => setMethod(e.target.value)} {...aria('method')} />
        <LengthHint id="method" value={method} min={LIMITS.method.min} max={LIMITS.method.max} hint={HINTS.method} invalid={Boolean(err('method'))} />
        <FieldError id="method" message={uniqueFieldError(err('method'), HINTS.method, topError)} />
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="isAlcoholFree" value="true" checked={alcoholFree} onChange={(e) => setAlcoholFree(e.target.checked)} className="accent-accent" /> Alcohol-free 🌱
      </label>
      <ImageInput label={defaults.image_url ? 'Replace photo (optional)' : 'Photo (optional)'} />
      <FieldError id="cover" message={err('cover')} />
      {defaults.image_url && (
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" name="removeCover" value="true" className="accent-accent" /> Remove current photo
        </label>
      )}
      <button className="btn-primary" disabled={pending} data-testid="drink-submit">{pending ? 'Saving…' : submitLabel}</button>
    </form>
  )
}
