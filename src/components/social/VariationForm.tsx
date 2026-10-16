'use client'
import { useActionState, useEffect, useRef } from 'react'
import { addVariation, type FormState } from '@/app/(main)/games/actions'

export default function VariationForm({ kind, targetId }: { kind: 'game' | 'cocktail'; targetId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addVariation, {})
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.ok) ref.current?.reset()
  }, [state])
  return (
    <details className="card p-4" data-testid="variation-form">
      <summary className="cursor-pointer text-accent-cyan font-medium">
        ➕ {kind === 'game' ? 'Add your house rules' : 'Add your twist'}
      </summary>
      <form ref={ref} action={action} className="space-y-3 mt-4">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="targetId" value={targetId} />
        <input name="title" className="input" placeholder="Variation name" required minLength={3} maxLength={80} aria-label="Variation name" />
        <textarea name="rules" rows={4} className="input" placeholder="What changes?" required minLength={10} aria-label="Variation details" />
        {state.error && <p className="error-msg" role="alert">{state.error}</p>}
        <button className="btn-secondary" disabled={pending}>{pending ? 'Saving…' : 'Save variation'}</button>
      </form>
    </details>
  )
}
