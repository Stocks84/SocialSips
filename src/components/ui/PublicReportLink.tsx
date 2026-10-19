import Link from 'next/link'
import type { ReportTarget } from './ReportButton'

/** Signed-out visitors: "⚑ Report" opens the public report form for this exact item (DSA Art. 16). */
export default function PublicReportLink({ targetType, targetId }: { targetType: ReportTarget; targetId: string }) {
  return (
    <Link href={`/report?type=${targetType}&id=${targetId}`} className="text-xs text-text-muted hover:text-accent-pink" data-testid="public-report-link" rel="nofollow">
      ⚑ Report
    </Link>
  )
}
