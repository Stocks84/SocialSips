import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminTabs from '@/components/admin/AdminTabs'
import PageHeader from '@/components/ui/PageHeader'
import { getViewer } from '@/lib/server/viewer'
import { getOpenReportCount } from '@/lib/queries/admin'
import { listFlaggedWording, type FlaggedKind } from '@/lib/queries/wording-flags'
import { adminTitle } from '@/lib/server/page-meta'
import { formatDate } from '@/lib/format'

export const generateMetadata = adminTitle('Wording flags · Admin')
export const dynamic = 'force-dynamic'

const KIND_LABEL: Record<FlaggedKind, string> = {
  game: 'Game',
  comment: 'Comment',
  dare: 'Dare',
  game_variation: 'House rules',
  drink_variation: 'Drink twist',
  meme: 'Meme',
}

/** Admin review list. The flag is computed in this view from a small phrase list — no extra database column. */
export default async function AdminWordingPage() {
  const { isAdmin } = await getViewer()
  if (!isAdmin) notFound()
  const [openReports, items] = await Promise.all([getOpenReportCount(), listFlaggedWording()])
  return (
    <>
      <PageHeader
        title="Wording flags"
        subtitle="Posts, comments and Dares whose wording looks like hazing or “drink until you pass out”. This is a review list, not an automatic hide."
      />
      <AdminTabs active="wording" openReports={openReports} />
      {items === null ? (
        <p className="text-sm text-ink-2">Could not load items just now.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-2" data-testid="wording-flag-empty">Nothing in the recent posts matches the wording list.</p>
      ) : (
        <ul className="space-y-3" data-testid="wording-flag-list">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="card p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="chip">{KIND_LABEL[item.kind]}</span>
                <span className="chip text-danger" data-testid="wording-flag-phrase">Flagged: {item.match.phrase}</span>
                {item.createdAt && <span className="text-xs text-ink-3">{formatDate(item.createdAt)}</span>}
              </div>
              <p className="font-medium">{item.title}</p>
              {item.excerpt && <p className="text-sm text-ink-2">{item.excerpt}</p>}
              {item.href && <Link href={item.href} className="text-accent text-sm font-medium">Open →</Link>}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
