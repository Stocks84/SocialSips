'use client'
import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn, type AuthState } from '../actions'
import { safePath } from '@/lib/safe-path'

export default function SignInForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {})
  const params = useSearchParams()
  const redirectTo = safePath(params.get('redirectTo'))
  const linkError = params.get('error') === 'link' ? 'That sign-in link is invalid or has expired. Please sign in.' : null
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" required />
      </div>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" name="remember" value="1" defaultChecked className="accent-accent-purple" /> Keep me signed in
      </label>
      {!state.error && linkError && <p className="error-msg" role="alert">{linkError}</p>}
      {state.error && <p className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  )
}
