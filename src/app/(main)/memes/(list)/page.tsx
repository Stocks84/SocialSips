import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import SavedBanner from '@/components/ui/SavedBanner'
import MemeCard from '@/components/memes/MemeCard'
import { getViewer } from '@/lib/server/viewer'
import { listMemes, type MemeSort, type TopRange } from '@/lib/queries/memes'

export const metadata = { title: 'Jokes & Memes' }

const PAGE_SIZE = 24

const DELETE_ERRORS: Record<string, string> = {
  signin: 'Sign in to delete your memes.',
  gone: 'That meme was already gone.',
  notyours: 'You can only delete your own memes.',
  failed: 'We couldn’t delete that meme. Please try again.',
}

type SP = { page?: string; saved?: string; deleted?: string; sort?: string; range?: string }

export default async function MemesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const page = Math.max(1, Math.min(100, Number(sp.page) || 1))
  const sort: MemeSort = sp.sort === 'top' ? 'top' : 'new'
  const range: TopRange = sp.range === 'all' ? 'all' : 'week'
  const { userId, isAdmin } = await getViewer()
  const { memes, hasMore } = await listMemes({ page, pageSize: PAGE_SIZE, sort, range, userId })

  const href = (p: Partial<{ page: number; sort: MemeSort; range: TopRange }>) => {
    const q = new URLSearchParams()
    const s = p.sort ?? sort
    if (s === 'top') { q.set('sort', 'top'); q.set('range', p.range ?? range) }
    if ((p.page ?? 1) > 1) q.set('page', String(p.page))
    const qs = q.toString()
    return qs ? `/memes?${qs}` : '/memes'
  }
  const tab = (active: boolean) => `px-4 py-1.5 rounded-full text-sm ${active ? 'bg-accent-purple/20 text-text-primary border border-accent-purple' : 'text-text-secondary hover:text-text-primary border border-transparent'}`

  return (
    <>
      <SavedBanner show={sp.saved === '1'} />
      <SavedBanner show={sp.deleted === 'deleted'} text="Meme deleted 🗑️" />
      {sp.deleted && sp.deleted !== 'deleted' && (
        <p className="error-msg card-glass p-3 mb-4 text-sm" role="alert" data-testid="delete-error">
          {DELETE_ERRORS[sp.deleted] ?? DELETE_ERRORS.failed}
        </p>
      )}
      <div className="flex items-start justify-between gap-4">
        <PageHeader emoji="😂" title="Jokes & Memes" subtitle="Party-approved laughs from the community." />
        <Link href="/memes/new" className="btn-primary text-sm shrink-0">+ Post</Link>
      </div>
      <nav className="flex flex-wrap items-center gap-2 mb-6" aria-label="Sort memes" data-testid="meme-tabs">
        <Link href={href({ sort: 'new' })} className={tab(sort === 'new')} aria-current={sort === 'new' ? 'page' : undefined}>🆕 New</Link>
        <Link href={href({ sort: 'top' })} className={tab(sort === 'top')} aria-current={sort === 'top' ? 'page' : undefined}>🏆 Top</Link>
        {sort === 'top' && (
          <span className="flex gap-1 ml-2 text-xs" data-testid="top-range">
            <Link href={href({ sort: 'top', range: 'week' })} className={tab(range === 'week')}>This week</Link>
            <Link href={href({ sort: 'top', range: 'all' })} className={tab(range === 'all')}>All time</Link>
          </span>
        )}
      </nav>
      {memes.length === 0 && page === 1 && (
        <div className="card p-6 mb-6" data-testid="memes-empty">
          <p className="text-lg">Why did the cocktail go to therapy? 🍸</p>
          <p className="text-accent-pink mt-1">It had too many mixed feelings.</p>
          <p className="text-text-secondary text-sm mt-4">
            {sort === 'top' && range === 'week' ? 'No memes this week yet. ' : 'No memes yet. '}
            <Link href="/memes/new" className="text-accent-purple">Be the first to post one →</Link>
          </p>
        </div>
      )}
      {memes.length === 0 && page > 1 && (
        <p className="text-text-secondary text-sm mb-6">That&apos;s the bottom of the barrel. <Link href={href({ page: 1 })} className="text-accent-purple">Back to the start →</Link></p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {memes.map((m) => <MemeCard key={m.id} meme={m} userId={userId} isAdmin={isAdmin} />)}
      </div>
      {(page > 1 || hasMore) && (
        <nav className="flex justify-between mt-8 text-sm" aria-label="More memes">
          {page > 1 ? <Link href={href({ page: page - 1 })} className="btn-ghost">← {sort === 'top' ? 'Previous' : 'Newer'}</Link> : <span />}
          {hasMore && <Link href={href({ page: page + 1 })} className="btn-ghost" data-testid="memes-older">{sort === 'top' ? 'More →' : 'Older memes →'}</Link>}
        </nav>
      )}
    </>
  )
}
