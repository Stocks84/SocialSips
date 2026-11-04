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
      <input id="dob" name="dob" type="date" required className="input" autoComplete="bday" defaultValue={state.dob} aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? 'dob-error' : undefined} />
      {state.error && <p id="dob-error" className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'Checking…' : 'Let me in 🚀'}</button>
    </form>
  )
}
