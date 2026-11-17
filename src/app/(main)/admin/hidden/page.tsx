import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { resolveTargets, TARGETS, type TargetType } from '@/lib/server/moderation'
import { formatDate } from '@/lib/format'
import { deleteItem, secureHiddenImages, unhideItem } from '../actions'
import SubmitButton from '@/components/ui/SubmitButton'
import { adminTitle } from '@/lib/server/page-meta'

export const generateMetadata = adminTitle('Hidden items')
export const dynamic = 'force-dynamic'

const TYPES = Object.keys(TARGETS) as TargetType[]

export default async function AdminHiddenPage({ searchParams }: { searchParams: Promise<{ secured?: string; failed?: string }> }) {
  const supabase = await createClient()
  const { isAdmin } = await getViewer()
  if (!supabase || !isAdmin) notFound()
  const { secured, failed } = await searchParams

  // Admin RLS can see hidden rows. Fetch hidden ids per table, then resolve previews.
  const lists = await Promise.all(
    TYPES.map(async (type) => {
      const { data } = await supabase.from(TARGETS[type].table).select('id, created_at').eq('is_hidden', true)
        .order('created_at', { ascending: false }).limit(50)
      return (data ?? []).map((r: { id: string; created_at: string }) => ({ type, ...r }))
    }),
  )
  const items = lists.flat()
  const resolved = await resolveTargets(supabase, items)

  return (
    <>
      <PageHeader title="Hidden items" subtitle={`${items.length} hidden`} />
      <p className="text-sm mb-6"><Link href="/admin/reports" className="text-accent">← Open reports</Link></p>
      {secured !== undefined && (
        <p role="status" className={`card p-4 mb-4 text-sm ${Number(failed) > 0 ? 'text-danger' : 'text-accent'}`} data-testid="secure-result">
          {Number(secured) || 0} image{Number(secured) === 1 ? '' : 's'} made private{Number(failed) > 0 ? `, ${Number(failed)} failed (try again)` : ''}.
        </p>
      )}
      <form action={secureHiddenImages} className="card p-4 mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-ink-2 max-w-md">Hidden items&apos; images move to a private bucket automatically. Press this to catch any that are still public (items hidden before this feature, or a move that failed).</p>
        <SubmitButton className="btn-secondary text-sm py-2 px-4" pendingLabel="Working…" data-testid="secure-hidden">Make hidden images private</SubmitButton>
      </form>
      {items.length === 0 && <p className="card p-6 text-center text-ink-2">Nothing hidden.</p>}
      <div className="space-y-4">
        {items.map((it, i) => {
          const fields = (
            <>
              <input type="hidden" name="targetType" value={it.type} />
              <input type="hidden" name="targetId" value={it.id} />
            </>
          )
          return (
            <div key={`${it.type}-${it.id}`} className="card p-5" data-testid="hidden-item">
              <div className="flex items-center gap-2 text-xs mb-2">
                <span className="chip">{TARGETS[it.type].label}</span>
                <span className="text-ink-3">{formatDate(it.created_at)}</span>
              </div>
              <p className="text-sm">{resolved[i].preview}</p>
              <div className="flex gap-2 mt-4">
                <form action={unhideItem}>{fields}<SubmitButton className="btn-secondary text-sm py-2 px-4" pendingLabel="Unhiding…">Unhide</SubmitButton></form>
                <form action={deleteItem}>{fields}<SubmitButton className="btn-danger text-sm py-2 px-4" confirm="Delete this item permanently?" pendingLabel="Deleting…">Delete</SubmitButton></form>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
