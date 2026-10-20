'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { acceptTerms, type AcceptState } from './actions'

export default function AcceptForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(acceptTerms, {} as AcceptState)
  return (
    <form action={action} className="space-y-4" data-testid="accept-terms-form">
      <input type="hidden" name="next" value={next} />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="accept" value="true" required className="mt-1 accent-accent-purple" data-testid="accept-checkbox" />
        <span>I have read and accept the <Link href="/terms" className="text-accent-purple underline" target="_blank">Terms of Use</Link> and the <Link href="/privacy" className="text-accent-purple underline" target="_blank">Privacy Policy</Link>.</span>
      </label>
      {state.error && <p role="alert" className="text-sm text-red-400" data-testid="accept-error">{state.error}</p>}
      <button className="btn-primary" disabled={pending} data-testid="accept-btn">{pending ? 'Saving…' : 'Accept and continue'}</button>
    </form>
  )
}
