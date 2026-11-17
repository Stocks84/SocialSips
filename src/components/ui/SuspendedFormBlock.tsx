import Link from 'next/link'
import { suspendedBlockCopy, suspendedNoteCopy } from '@/lib/suspension'

/** Replaces a create/edit form for a suspended member. The server actions and the database still refuse the write (migration 0040).
 *  `compact` is a one-line version for comment, variation and rating forms and vote buttons. */
export default function SuspendedFormBlock({ action, reason, compact = false }: { action: string; reason: string | null; compact?: boolean }) {
  if (compact) {
    const note = suspendedNoteCopy(action, reason)
    return (
      <p role="status" className="card border-danger p-4 text-sm text-ink-2" data-testid="suspended-note">
        {note.text} <Link href="/terms" className="text-accent underline">Terms</Link>
        {note.reason && <> · Reason given: <span className="text-ink">{note.reason}</span></>}
      </p>
    )
  }
  const copy = suspendedBlockCopy(action, reason)
  return (
    <section role="status" className="card max-w-2xl border-danger p-5 text-sm" data-testid="suspended-form-block">
      <h2 className="font-semibold text-danger">{copy.heading}</h2>
      <p className="mt-1 text-ink-2">
        {copy.body} To appeal, see <Link href="/terms" className="text-accent underline">the Terms</Link>.
      </p>
      {copy.reason && <p className="mt-2 text-ink-2">Reason given: <span className="text-ink">{copy.reason}</span></p>}
    </section>
  )
}
