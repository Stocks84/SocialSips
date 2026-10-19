import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { REPORT_REASONS } from '@/lib/validators/comment'
import { L } from '@/components/legal/Legal'
import { formatDate } from '@/lib/format'

export type Notice = { id: string; target_type: string; target_id: string; reason: string; explanation: string | null; preview: string | null; created_at: string; reversed_at: string | null }

const LABEL: Record<string, string> = { game: 'game', cocktail: 'cocktail', meme: 'meme', comment: 'comment', variation: 'game variation', cocktail_variation: 'cocktail variation' }

/** One statement of reasons (DSA Art. 17). Only the author (and admins) can read notices (RLS). */
export function NoticeBody({ n }: { n: Notice }) {
  return (
    <div className="space-y-1 text-sm" data-testid="statement-of-reasons">
      <p><strong>What we did:</strong> a moderator hid or removed your {LABEL[n.target_type] ?? 'post'}{n.preview ? <> (“{n.preview}”)</> : null} on {formatDate(n.created_at)}.{n.reversed_at && <> <span className="badge badge-cyan">Reversed {formatDate(n.reversed_at)}</span></>}</p>
      <p><strong>Why:</strong> <span data-testid="sor-reason">{REPORT_REASONS[n.reason as keyof typeof REPORT_REASONS] ?? n.reason}</span>, which breaks our <Link href="/terms" className="text-accent-purple">Terms of Use</Link> (section 5){n.reason === 'illegal' ? ' and may be illegal' : ''}.</p>
      {n.explanation && <p><strong>Moderator&apos;s note:</strong> <span data-testid="sor-explanation">{n.explanation}</span></p>}
      <p className="text-text-secondary">Decided by a person, not automatically. Think we got it wrong? Email <L k="contactEmail" mailto /> within 6 months and we&apos;ll review it.</p>
    </div>
  )
}

/** The latest active notice for one item, shown to its author under the "Hidden" banner. */
export default async function StatementOfReasons({ type, id }: { type: string; id: string }) {
  const supabase = await createClient()
  if (!supabase) return null
  const { data } = await supabase.from('moderation_notices')
    .select('id, target_type, target_id, reason, explanation, preview, created_at, reversed_at')
    .eq('target_type', type).eq('target_id', id).is('reversed_at', null).order('created_at', { ascending: false }).limit(1)
  const n = (data?.[0] ?? null) as Notice | null
  if (!n) return null
  return <div className="card-glass p-4 my-3"><NoticeBody n={n} /></div>
}
