'use client'
import { useActionState } from 'react'
import Turnstile from '@/components/ui/Turnstile'
import { useSearchParams } from 'next/navigation'
import { signIn, type AuthState } from '../actions'
import { safePath } from '@/lib/safe-path'
import { faCheck, faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

export default function SignInForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {})
  const v = state.values // keep what was typed after an error (never the password)
  const params = useSearchParams()
  const redirectTo = safePath(params.get('redirectTo'))
  const linkError = params.get('error') === 'link' ? 'That sign-in link is invalid or has expired. Please sign in.' : null
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} defaultValue={v?.email} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" required autoComplete="current-password" />
      </div>
      <label className="flex min-h-6 cursor-pointer items-center gap-3 text-base text-ink-2">
        <span className="relative inline-flex shrink-0">
          <input type="checkbox" name="remember" value="1" defaultChecked={v?.remember ?? true} className="checkbox-box peer" />
          <Icon icon={faCheck} className="checkbox-tick pointer-events-none absolute inset-0 m-auto text-[12px] text-on-accent opacity-0 peer-checked:opacity-100" />
        </span>
        Keep me signed in
      </label>
      <Turnstile resetKey={state} action="sign-in" />
      {!state.error && linkError && <p className="error-msg flex items-start gap-2" role="alert"><Icon icon={faCircleExclamation} className="mt-[3px] shrink-0 text-icon-sm" />{linkError}</p>}
      {state.error && <p className="error-msg flex items-start gap-2" role="alert"><Icon icon={faCircleExclamation} className="mt-[3px] shrink-0 text-icon-sm" />{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  )
}
