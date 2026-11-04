'use client'
import SubmitButton from './SubmitButton'

/** Submit button that asks "Are you sure?" first (irreversible actions like deleting) and shows a pending state. */
export default function ConfirmSubmit({ message, className, children, label, pendingLabel = 'Deleting…' }: { message: string; className?: string; children: React.ReactNode; label?: string; pendingLabel?: React.ReactNode }) {
  return (
    <SubmitButton confirm={message} className={className} aria-label={label} pendingLabel={pendingLabel}>
      {children}
    </SubmitButton>
  )
}
