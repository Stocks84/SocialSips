'use client'
import { useActionState } from 'react'
import Turnstile from '@/components/ui/Turnstile'
import { useSearchParams } from 'next/navigation'
import { requestPasswordReset, type AuthState } from '../actions'
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {})
  const v = state.values
  const params = useSearchParams()
  const linkError = params.get('error') === 'link' ? 'That reset link is invalid or has expired. Please request a new one.' : null
  return (
    <form action={action} className="space-y-4" data-testid="forgot-password-form">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} defaultValue={v?.email} />
      </div>
      <Turnstile resetKey={state} action="reset-password" />
      {state.message && !state.error && (
        <p className="text-sm text-ink" role="status" data-testid="forgot-success">{state.message}</p>
      )}
      {!state.error && !state.message && linkError && (
        <p className="error-msg flex items-start gap-2" role="alert"><Icon icon={faCircleExclamation} className="mt-[3px] shrink-0 text-icon-sm" />{linkError}</p>
      )}
      {state.error && <p className="error-msg flex items-start gap-2" role="alert"><Icon icon={faCircleExclamation} className="mt-[3px] shrink-0 text-icon-sm" />{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending} data-testid="forgot-submit">{pending ? 'Sending…' : 'Send reset link'}</button>
    </form>
  )
}
