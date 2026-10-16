'use client'
import { useActionState, useEffect, useRef } from 'react'
import { addComment, type FormState } from '@/app/(main)/games/actions'

export default function CommentForm({ kind, targetId }: { kind: 'game' | 'cocktail'; targetId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addComment, {})
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.ok) ref.current?.reset()
  }, [state])
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="targetId" value={targetId} />
      <textarea name="body" rows={3} maxLength={1000} required className="input" placeholder="Tried it? Tell us how it went…" aria-label="Comment" />
      {state.error && <p className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? 'Posting…' : 'Post comment'}</button>
    </form>
  )
}
