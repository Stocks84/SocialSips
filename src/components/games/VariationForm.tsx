'use client'
import { useActionState } from 'react'
import { addVariation, type FormState } from '@/app/(main)/games/actions'

export default function VariationForm({ gameId }: { gameId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addVariation, {})
  return (
    <details className="card p-4">
      <summary className="cursor-pointer text-accent-cyan font-medium">➕ Add your house rules</summary>
      <form action={action} className="space-y-3 mt-4">
        <input type="hidden" name="gameId" value={gameId} />
        <input name="title" className="input" placeholder="Variation name" required minLength={3} maxLength={80} aria-label="Variation name" />
        <textarea name="rules" rows={4} className="input" placeholder="What changes?" required minLength={10} aria-label="Variation rules" />
        {state.error && <p className="error-msg" role="alert">{state.error}</p>}
        <button className="btn-secondary" disabled={pending}>{pending ? 'Saving…' : 'Save variation'}</button>
      </form>
    </details>
  )
}
