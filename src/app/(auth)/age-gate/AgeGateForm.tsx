'use client'
import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { verifyAge, type AgeGateState } from './actions'

export default function AgeGateForm() {
  const params = useSearchParams()
  const [state, action, pending] = useActionState<AgeGateState, FormData>(verifyAge, {})

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="redirectTo" value={params.get('redirectTo') ?? ''} />
      <label className="label" htmlFor="dob">Date of birth</label>
      <input id="dob" name="dob" type="date" required className="input" />
      {state.error && <p className="error-msg">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'Checking…' : 'Let me in 🚀'}</button>
    </form>
  )
}
