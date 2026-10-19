import Image from 'next/image'
import { isOwnStorageUrl } from '@/lib/storage'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import ReportButton from '@/components/ui/ReportButton'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import { deleteMeme } from './actions'
import { getViewer } from '@/lib/server/viewer'
import HiddenNotice from '@/components/ui/HiddenNotice'
import { visibleTo } from '@/lib/queries/visibility'
import SavedBanner from '@/components/ui/SavedBanner'
import ConfirmSubmit from '@/components/ui/ConfirmSubmit'
import AdminControls from '@/components/admin/AdminControls'

export const metadata = { title: 'Jokes & Memes' }

type MemeRow = { id: string; caption: string | null; image_url: string | null; joke_text: string | null; created_at: string; author_id: string; is_hidden?: boolean; author: { username: string } | null }

const PAGE_SIZE = 24

const DELETE_ERRORS: Record<string, string> = {
  signin: 'Sign in to delete your memes.',
  gone: 'That meme was already gone.',
  notyours: 'You can only delete your own memes.',
  failed: 'We couldn’t delete that meme. Please try again.',
}

export default async function MemesPage({ searchParams }: { searchParams: Promise<{ page?: string; saved?: string; deleted?: string }> }) {
  const sp = await searchParams
  const saved = sp.saved
  const deleted = sp.deleted
  const page = Math.max(1, Math.min(100, Number(sp.page) || 1))
  const supabase = await createClient()
  let memes: MemeRow[] = []
  let hasMore = false
  const { userId, isAdmin } = await getViewer()
  if (supabase) {
    const { data } = await supabase.from('memes').select('id, caption, image_url, joke_text, created_at, author_id, is_hidden, author:profiles(username)')
      .or(visibleTo(userId)).order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE) // one extra row = "is there more?"
    const rows = (data ?? []) as unknown as MemeRow[]
    hasMore = rows.length > PAGE_SIZE
    memes = rows.slice(0, PAGE_SIZE)
  }
  return (
    <>
      <SavedBanner show={saved === '1'} />
      <SavedBanner show={deleted === 'deleted'} text="Meme deleted 🗑️" />
      {deleted && deleted !== 'deleted' && (
        <p className="error-msg card-glass p-3 mb-4 text-sm" role="alert" data-testid="delete-error">
          {DELETE_ERRORS[deleted] ?? DELETE_ERRORS.failed}
        </p>
      )}
      <div className="flex items-start justify-between gap-4">
        <PageHeader emoji="😂" title="Jokes & Memes" subtitle="Party-approved laughs from the community." />
        <Link href="/memes/new" className="btn-primary text-sm shrink-0">+ Post</Link>
      </div>
      {memes.length === 0 && page === 1 && (
        <div className="card p-6 mb-6" data-testid="memes-empty">
          <p className="text-lg">Why did the cocktail go to therapy? 🍸</p>
          <p className="text-accent-pink mt-1">It had too many mixed feelings.</p>
          <p className="text-text-secondary text-sm mt-4">No memes yet. <Link href="/memes/new" className="text-accent-purple">Be the first to post one →</Link></p>
        </div>
      )}
      {memes.length === 0 && page > 1 && (
        <p className="text-text-secondary text-sm mb-6">That&apos;s the bottom of the barrel. <Link href="/memes" className="text-accent-purple">Back to the newest →</Link></p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {memes.map((m) => (
          <figure key={m.id} id={`meme-${m.id}`} className="card overflow-hidden" data-testid="meme">
            {isOwnStorageUrl(m.image_url) && <Image src={m.image_url} alt={m.caption ?? 'Meme'} width={1200} height={900} sizes="(min-width: 640px) 50vw, 100vw" className="w-full h-auto" />}
            <figcaption className="p-4 space-y-2">
              {m.is_hidden && <HiddenNotice />}
              {m.caption && <p className="font-semibold">{m.caption}</p>}
              {m.joke_text && <p className="whitespace-pre-line text-accent-pink">{m.joke_text}</p>}
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>@{m.author?.username ?? 'someone'} · {formatDate(m.created_at)}</span>
                {m.author_id === userId ? (
                  <span className="flex gap-3">
                    <Link href={`/memes/${m.id}/edit`} className="hover:text-accent-cyan">Edit</Link>
                    <form action={deleteMeme}>
                      <input type="hidden" name="memeId" value={m.id} />
                      <ConfirmSubmit message="Delete this meme? There's no undo." className="hover:text-accent-pink" label="Delete meme">Delete</ConfirmSubmit>
                    </form>
                  </span>
                ) : userId ? (
                  <ReportButton targetType="meme" targetId={m.id} />
                ) : null}
              </div>
              {isAdmin && <AdminControls type="meme" id={m.id} compact />}
            </figcaption>
          </figure>
        ))}
      </div>
      {(page > 1 || hasMore) && (
        <nav className="flex justify-between mt-8 text-sm" aria-label="More memes">
          {page > 1 ? <Link href={page === 2 ? '/memes' : `/memes?page=${page - 1}`} className="btn-ghost">← Newer</Link> : <span />}
          {hasMore && <Link href={`/memes?page=${page + 1}`} className="btn-ghost" data-testid="memes-older">Older memes →</Link>}
        </nav>
      )}
    </>
  )
}
