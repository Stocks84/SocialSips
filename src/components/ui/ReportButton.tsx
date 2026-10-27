'use client'
import { useActionState } from 'react'
import { reportContent, type FormState } from '@/lib/actions/social'
import { REPORT_REASONS } from '@/lib/validators/comment'

export type ReportTarget = 'game' | 'comment' | 'variation' | 'cocktail' | 'cocktail_variation' | 'meme'
type Props = { targetType: ReportTarget; targetId: string }

/** Small "Report" disclosure with reason + optional note. Only rendered for signed-in users. */
export default function ReportButton({ targetType, targetId }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(reportContent, {})
  if (state.ok) return <span className="text-xs text-accent-cyan" role="status">Reported, thanks 🙏</span>
  return (
    <details className="text-xs relative">
      <summary className="cursor-pointer text-text-muted hover:text-accent-pink list-none" aria-label={`Report ${targetType}`}>⚑ Report</summary>
      <form action={action} className="card p-3 mt-2 space-y-2 absolute right-0 z-30 w-64 shadow-card-lg">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <select name="reason" required className="input text-xs" defaultValue="" aria-label="Reason">
          <option value="" disabled>Why are you reporting this?</option>
          {Object.entries(REPORT_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <textarea name="note" maxLength={500} rows={2} className="input text-xs" placeholder="Optional note" aria-label="Note" />
        {state.error && <p className="error-msg">{state.error}</p>}
        <button className="btn-danger text-xs py-1 px-3" disabled={pending}>{pending ? 'Sending…' : 'Send report'}</button>
      </form>
    </details>
  )
}
