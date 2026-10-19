import { REPORT_REASONS } from '@/lib/validators/comment'

/** Reason + explanation the author sees as a statement of reasons when an admin hides or deletes their item. */
export default function ModReasonFields({ defaultReason = '' }: { defaultReason?: string }) {
  return (
    <>
      <select name="modReason" required defaultValue={defaultReason} className="input text-xs" aria-label="Reason shown to the author" data-testid="mod-reason">
        <option value="" disabled>Reason (shown to the author)</option>
        {Object.entries(REPORT_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <textarea name="modExplanation" maxLength={1000} rows={2} className="input text-xs" placeholder="Explanation for the author (optional): what rule, what to change" aria-label="Explanation for the author" data-testid="mod-explanation" />
    </>
  )
}
