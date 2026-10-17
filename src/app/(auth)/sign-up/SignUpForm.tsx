'use client'
import { useActionState } from 'react'
import { signUp, type AuthState } from '../actions'

const USERNAME_HINT = '3–20 characters: lowercase letters, numbers or _'

export default function SignUpForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {})
  if (state.message) return <p className="card-glass p-4 text-center">{state.message}</p>
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          className="input"
          required
          pattern="[a-z0-9_]{3,20}"
          title={USERNAME_HINT}
          aria-describedby="username-hint"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          onChange={(e) => {
            const el = e.currentTarget
            const clean = el.value.toLowerCase().trim()
            if (clean !== el.value) el.value = clean
          }}
        />
        <p id="username-hint" className="text-text-muted text-xs mt-1">{USERNAME_HINT}</p>
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" required minLength={8} />
      </div>
      <div>
        <label className="label" htmlFor="dateOfBirth">Date of birth</label>
        <input id="dateOfBirth" name="dateOfBirth" type="date" className="input" required />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="ageConfirmed" value="true" required className="mt-1 accent-accent-purple" />
        <span>I confirm I am 18 or over, and I&apos;ll drink responsibly.</span>
      </label>
      {state.error && <p className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'Creating…' : 'Create account'}</button>
    </form>
  )
}
