'use client'
import { useFormStatus } from 'react-dom'

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Shown on the clicked button while the form's server action runs (e.g. "Deleting…"). */
  pendingLabel?: React.ReactNode
  /** Ask "Are you sure?" first (irreversible actions). */
  confirm?: string
}

/**
 * Submit button for server-action forms. While the action runs every submit button in the form is
 * disabled (no double posts on slow networks) and the clicked one shows `pendingLabel` + aria-busy.
 * Works inside server components: only this button is a client component.
 */
export default function SubmitButton({ children, pendingLabel, confirm, disabled, onClick, className, ...rest }: Props) {
  const status = useFormStatus()
  const { pending } = status
  // Several submit buttons can share a form (star rating, Hide/Delete): figure out which one was clicked.
  const mine = pending && (
    typeof rest.formAction === 'function' ? status.action === rest.formAction
    : rest.name ? status.data?.get(rest.name) === String(rest.value ?? '')
    : true
  )
  return (
    <button
      type="submit"
      {...rest}
      className={`${className ?? ''} disabled:cursor-wait disabled:opacity-60`}
      disabled={disabled || pending}
      aria-busy={mine || undefined}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) { e.preventDefault(); return }
        onClick?.(e)
      }}
    >
      {mine && pendingLabel ? pendingLabel : children}
    </button>
  )
}

/** Inline status text that only renders while the surrounding form is submitting. */
export function PendingNote({ children = 'Saving…', className = 'text-text-secondary text-sm' }: { children?: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return <span role="status" aria-live="polite" className={className}>{pending ? children : null}</span>
}
