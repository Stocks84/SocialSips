'use client'
import { useActionState } from 'react'
import type { EditState } from '@/lib/validators/issues'

export default function DeleteAccountForm({ action, username }: { action: (s: EditState, f: FormData) => Promise<EditState>; username: string }) {
  const [state, formAction, pending] = useActionState(action, {} as EditState)
  return (
    <form action={formAction} className="space-y-3" data-testid="delete-account-form">
      <p className="text-sm text-text-secondary">This permanently deletes your profile, games, cocktails, memes, comments, variations, ratings, reactions and uploaded images, and your login. It can&apos;t be undone.</p>
      <label className="block text-sm">Type your username <strong>{username}</strong> to confirm
        <input name="confirm" className="input mt-1" autoComplete="off" data-testid="delete-confirm" required />
      </label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="understand" value="true" required data-testid="delete-understand" /> I understand this can&apos;t be undone.</label>
      {state.error && <p role="alert" className="text-sm text-red-400" data-testid="delete-error">{state.error}</p>}
      <button disabled={pending} className="btn-primary bg-red-600" data-testid="delete-account-btn">{pending ? 'Deleting…' : 'Delete my account'}</button>
    </form>
  )
}
