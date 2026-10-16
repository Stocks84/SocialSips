'use client'
import { useActionState, useEffect, useRef } from 'react'
import { addComment, type FormState } from '@/app/(main)/games/actions'

export default function CommentForm({ gameId }: { gameId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addComment, {})
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (!pending && !state.error) ref.current?.reset()
  }, [pending, state])
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="gameId" value={gameId} />
      <textarea name="body" rows={3} maxLength={1000} required className="input" placeholder="Played it? Tell us how it went…" aria-label="Comment" />
      {state.error && <p className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? 'Posting…' : 'Post comment'}</button>
    </form>
  )
}
