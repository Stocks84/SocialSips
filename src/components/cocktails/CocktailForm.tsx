'use client'
import { useActionState } from 'react'
import ImageInput from '@/components/ui/ImageInput'
import IngredientRows from './IngredientRows'
import FieldError from '@/components/ui/FieldError'
import type { EditState } from '@/lib/validators/issues'

type FormState = EditState
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
  // After a failed submit React resets the form, so refill it from what the user typed.
  const val = (k: string, d?: string) => { const v = state.values?.[k]; return typeof v === 'string' ? v : d }
  const err = (k: string) => state.fieldErrors?.[k]
  const aria = (k: string) => (err(k) ? { 'aria-invalid': true, 'aria-describedby': `${k}-error` } : {})
  const typedIngredients = Array.isArray(state.values?.ingredientItem)
    ? (state.values.ingredientItem as string[]).map((item, i) => ({ item, amount: String((state.values?.ingredientAmount as string[] | undefined)?.[i] ?? '') }))
    : undefined
  return (
    <form action={action} className="card p-6 space-y-5 max-w-2xl">
      {defaults.id && <input type="hidden" name="cocktailId" value={defaults.id} />}
      <div>
        <label className="label" htmlFor="name">Cocktail name</label>
        <input id="name" name="name" className="input" required minLength={2} maxLength={80} defaultValue={val('name', defaults.name)} {...aria('name')} />
        <FieldError id="name" message={err('name')} />
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <input id="description" name="description" className="input" required minLength={10} maxLength={300} defaultValue={val('description', defaults.description)} {...aria('description')} />
        <FieldError id="description" message={err('description')} />
      </div>
      <IngredientRows key={typedIngredients ? JSON.stringify(state.values) : 'initial'} initial={typedIngredients ?? defaults.ingredients} />
      <FieldError id="ingredients" message={err('ingredients')} />
      <div>
        <label className="label" htmlFor="method">Method</label>
        <textarea id="method" name="method" rows={5} className="input" required maxLength={3000} minLength={10} defaultValue={val('method', defaults.method)} {...aria('method')} />
        <FieldError id="method" message={err('method')} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isAlcoholFree" value="true" defaultChecked={state.values ? state.values.isAlcoholFree === 'true' : defaults.is_alcohol_free} className="accent-accent-cyan" /> Alcohol-free 🌱
      </label>
      <ImageInput label={defaults.image_url ? 'Replace photo (optional)' : 'Photo (optional)'} />
      <FieldError id="cover" message={err('cover')} />
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
