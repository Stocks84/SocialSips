'use client'
import { useActionState } from 'react'
import FieldError from '@/components/ui/FieldError'
import { REPORT_REASONS } from '@/lib/validators/comment'
import type { EditState } from '@/lib/validators/issues'
import { submitPublicReport } from './actions'

type Props = { targetType?: string; targetId?: string; targetLabel?: string; signedIn: boolean }

export default function ReportForm({ targetType, targetId, targetLabel, signedIn }: Props) {
  const [state, action, pending] = useActionState<EditState, FormData>(submitPublicReport, {})
  const val = (k: string) => { const v = state.values?.[k]; return typeof v === 'string' ? v : '' }
  const err = (k: string) => state.fieldErrors?.[k]
  if (state.ok) {
    return (
      <div className="card p-6 space-y-2" role="status" data-testid="report-sent">
        <h2 className="font-bold text-lg">Thanks, your report was sent 🙏</h2>
        <p className="text-text-secondary text-sm">A person reviews every report. {signedIn ? 'You can follow its status in Settings → Account.' : 'If you left an email, we may contact you about it.'}</p>
      </div>
    )
  }
  return (
    <form action={action} className="card p-6 space-y-5 max-w-2xl" data-testid="public-report-form">
      {targetType && targetId ? (
        <>
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <p className="text-sm">Reporting: <span className="badge badge-purple">{targetLabel ?? targetType}</span></p>
        </>
      ) : (
        <div>
          <label className="label" htmlFor="url">Link to the content</label>
          <input id="url" name="url" maxLength={500} className="input" defaultValue={val('url')} placeholder="https://… (the post, meme, comment or profile)" aria-describedby="url-error" />
          <FieldError id="url" message={err('url')} />
        </div>
      )}
      <div>
        <label className="label" htmlFor="reason">What&apos;s wrong?</label>
        <select id="reason" name="reason" required className="input" defaultValue={val('reason')} aria-describedby="reason-error">
          <option value="" disabled>Pick a reason</option>
          {Object.entries(REPORT_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <FieldError id="reason" message={err('reason')} />
      </div>
      <div>
        <label className="label" htmlFor="note">Details</label>
        <textarea id="note" name="note" rows={4} maxLength={500} required className="input" defaultValue={val('note')} placeholder="Why is it illegal or against the rules? For copyright, say what you own." aria-describedby="note-error" />
        <FieldError id="note" message={err('note')} />
      </div>
      <div>
        <label className="label" htmlFor="email">Your email (optional)</label>
        <input id="email" name="email" type="email" maxLength={254} className="input" defaultValue={val('email')} placeholder="Only if you want us to reply" aria-describedby="email-error" />
        <FieldError id="email" message={err('email')} />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="goodFaith" value="true" required className="mt-1 accent-accent-purple" />
        <span>I believe in good faith that the information in this report is accurate and complete.</span>
      </label>
      <FieldError id="goodFaith" message={err('goodFaith')} />
      {state.error && <p className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-danger" disabled={pending}>{pending ? 'Sending…' : 'Send report'}</button>
    </form>
  )
}
