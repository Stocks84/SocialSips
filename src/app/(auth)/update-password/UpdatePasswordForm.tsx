'use client'
import { useActionState, useState } from 'react'
import { updatePassword, type AuthState } from '../actions'
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

/** Fields are controlled so a failed submit cannot wipe what was typed. The server never echoes the password back. */
export default function UpdatePasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {})
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  return (
    <form action={action} className="space-y-4" data-testid="update-password-form" noValidate>
      <div>
        <label className="label" htmlFor="password">New password</label>
        <input id="password" name="password" type="password" className="input" required minLength={8} autoComplete="new-password" aria-describedby="password-hint" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p id="password-hint" className="text-ink-3 text-xs mt-1">At least 8 characters.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" className="input" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {state.error && <p className="error-msg flex items-start gap-2" role="alert"><Icon icon={faCircleExclamation} className="mt-[3px] shrink-0 text-icon-sm" />{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending} data-testid="update-password-submit">{pending ? 'Saving…' : 'Update password'}</button>
    </form>
  )
}
