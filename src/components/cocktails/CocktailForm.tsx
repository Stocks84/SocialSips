'use client'
import { useActionState } from 'react'
import ImageInput from '@/components/ui/ImageInput'
import IngredientRows from './IngredientRows'

type FormState = { error?: string }
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
  action: (prev: FormState, fd: FormData) => Promise<FormState>
  defaults?: CocktailFormDefaults
  submitLabel: string
}

export default function CocktailForm({ action: serverAction, defaults = {}, submitLabel }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(serverAction, {})
  return (
    <form action={action} className="card p-6 space-y-5 max-w-2xl">
      {defaults.id && <input type="hidden" name="cocktailId" value={defaults.id} />}
      <div>
        <label className="label" htmlFor="name">Cocktail name</label>
        <input id="name" name="name" className="input" required minLength={2} maxLength={80} defaultValue={defaults.name} />
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <input id="description" name="description" className="input" required minLength={10} maxLength={300} defaultValue={defaults.description} />
      </div>
      <IngredientRows initial={defaults.ingredients} />
      <div>
        <label className="label" htmlFor="method">Method</label>
        <textarea id="method" name="method" rows={5} className="input" required minLength={10} defaultValue={defaults.method} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isAlcoholFree" value="true" defaultChecked={defaults.is_alcohol_free} className="accent-accent-cyan" /> Alcohol-free 🌱
      </label>
      <ImageInput label={defaults.image_url ? 'Replace photo (optional)' : 'Photo (optional)'} />
      {defaults.image_url && (
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" name="removeCover" value="true" className="accent-accent-pink" /> Remove current photo
        </label>
      )}
      {state.error && <p className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? 'Saving…' : submitLabel}</button>
    </form>
  )
}
