'use client'
import { useActionState } from 'react'
import { editVariation } from '@/app/(main)/admin/actions'
import FieldError from '@/components/ui/FieldError'
import type { EditState } from '@/lib/validators/issues'

type Props = { type: 'variation' | 'cocktail_variation'; id: string; title: string; rules: string; redirectTo?: string }

/** Admin-only inline editor for a variation. Render only for admins (server checks again). */
export default function VariationEditForm({ type, id, title, rules, redirectTo }: Props) {
  const [state, action, pending] = useActionState<EditState, FormData>(editVariation, {})
  const val = (k: string, d: string) => { const v = state.values?.[k]; return typeof v === 'string' ? v : d }
  const fid = (k: string) => `${k}-${id}`
  return (
    <details className="mt-2" data-testid="variation-edit" open={Boolean(state.error) || undefined}>
      <summary className="cursor-pointer text-xs text-accent-cyan">🛡️ Edit</summary>
      <form action={action} className="space-y-2 mt-2">
        <input type="hidden" name="targetType" value={type} />
        <input type="hidden" name="targetId" value={id} />
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
        <input name="title" defaultValue={val('title', title)} className="input" required minLength={3} maxLength={80} aria-label="Variation name" />
        <FieldError id={fid('title')} message={state.fieldErrors?.title} />
        <textarea name="rules" defaultValue={val('rules', rules)} rows={6} className="input" required minLength={10} maxLength={3000} aria-label="Variation details" />
        <FieldError id={fid('rules')} message={state.fieldErrors?.rules} />
        {state.error && <p className="error-msg text-xs" role="alert">{state.error}</p>}
        {state.ok && <p className="text-accent-cyan text-xs" role="status">Changes saved ✅</p>}
        <button className="btn-secondary text-xs py-1 px-3" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</button>
      </form>
    </details>
  )
}
