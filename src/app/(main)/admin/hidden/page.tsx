import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { resolveTarget, TARGETS, type TargetType } from '@/lib/server/moderation'
import { formatDate } from '@/lib/format'
import { deleteItem, unhideItem } from '../actions'

export const metadata = { title: 'Hidden items', robots: { index: false } }
export const dynamic = 'force-dynamic'

const TYPES = Object.keys(TARGETS) as TargetType[]

export default async function AdminHiddenPage() {
  const supabase = await createClient()
  const { isAdmin } = await getViewer()
  if (!supabase || !isAdmin) notFound()

  // Admin RLS can see hidden rows. Fetch hidden ids per table, then resolve previews.
  const lists = await Promise.all(
    TYPES.map(async (type) => {
      const { data } = await supabase.from(TARGETS[type].table).select('id, created_at').eq('is_hidden', true)
        .order('created_at', { ascending: false }).limit(50)
      return (data ?? []).map((r: { id: string; created_at: string }) => ({ type, ...r }))
    }),
  )
  const items = lists.flat()
  const resolved = await Promise.all(items.map((i) => resolveTarget(supabase, i.type, i.id)))

  return (
    <>
      <PageHeader emoji="🙈" title="Hidden items" subtitle={`${items.length} hidden`} />
      <p className="text-sm mb-6"><Link href="/admin/reports" className="text-accent-purple">← Open reports</Link></p>
      {items.length === 0 && <p className="card-glass p-6 text-center text-text-secondary">Nothing hidden.</p>}
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
                <span className="badge badge-purple">{TARGETS[it.type].label}</span>
                <span className="text-text-muted">{formatDate(it.created_at)}</span>
              </div>
              <p className="text-sm">{resolved[i].preview}</p>
              <div className="flex gap-2 mt-4">
                <form action={unhideItem}>{fields}<button className="btn-secondary text-sm py-2 px-4">Unhide</button></form>
                <form action={deleteItem}>{fields}<button className="btn-danger text-sm py-2 px-4">Delete</button></form>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
