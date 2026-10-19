'use client'
/** Submit button that asks "Are you sure?" first (for irreversible actions like deleting). */
export default function ConfirmSubmit({ message, className, children, label }: { message: string; className?: string; children: React.ReactNode; label?: string }) {
  return (
    <button className={className} aria-label={label} onClick={(e) => { if (!window.confirm(message)) e.preventDefault() }}>
      {children}
    </button>
  )
}
