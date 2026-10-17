import Image from 'next/image'
import { isOwnStorageUrl } from '@/lib/storage'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import ReportButton from '@/components/ui/ReportButton'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import { deleteMeme } from './actions'
import { getViewer } from '@/lib/server/viewer'
import AdminControls from '@/components/admin/AdminControls'

export const metadata = { title: 'Jokes & Memes' }

type MemeRow = { id: string; caption: string | null; image_url: string | null; joke_text: string | null; created_at: string; author_id: string; author: { username: string } | null }

export default async function MemesPage() {
  const supabase = await createClient()
  let memes: MemeRow[] = []
  const { userId, isAdmin } = await getViewer()
  if (supabase) {
    const { data } = await supabase.from('memes').select('id, caption, image_url, joke_text, created_at, author_id, author:profiles(username)')
      .eq('is_hidden', false).order('created_at', { ascending: false }).limit(50)
    memes = (data ?? []) as unknown as MemeRow[]
  }
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader emoji="😂" title="Jokes & Memes" subtitle="Party-approved laughs from the community." />
        <Link href="/memes/new" className="btn-primary text-sm shrink-0">+ Post</Link>
      </div>
      {memes.length === 0 && (
        <div className="card p-6 mb-6">
          <p className="text-lg">Why did the cocktail go to therapy? 🍸</p>
          <p className="text-accent-pink mt-1">It had too many mixed feelings.</p>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {memes.map((m) => (
          <figure key={m.id} id={`meme-${m.id}`} className="card overflow-hidden" data-testid="meme">
            {isOwnStorageUrl(m.image_url) && <Image src={m.image_url} alt={m.caption ?? 'Meme'} width={1200} height={900} className="w-full h-auto" />}
            <figcaption className="p-4 space-y-2">
              {m.caption && <p className="font-semibold">{m.caption}</p>}
              {m.joke_text && <p className="whitespace-pre-line text-accent-pink">{m.joke_text}</p>}
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>@{m.author?.username ?? 'someone'} · {formatDate(m.created_at)}</span>
                {m.author_id === userId ? (
                  <span className="flex gap-3">
                    <Link href={`/memes/${m.id}/edit`} className="hover:text-accent-cyan">Edit</Link>
                    <form action={deleteMeme}>
                      <input type="hidden" name="memeId" value={m.id} />
                      <button className="hover:text-accent-pink" aria-label="Delete meme">Delete</button>
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
    </>
  )
}
