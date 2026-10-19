import Link from 'next/link'
import { notFound } from 'next/navigation'
import MemeCard from '@/components/memes/MemeCard'
import CommentsSection from '@/components/social/CommentsSection'
import SavedBanner from '@/components/ui/SavedBanner'
import { getViewer } from '@/lib/server/viewer'
import { getMeme } from '@/lib/queries/memes'

export const metadata = { title: 'Meme' }

export default async function MemePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params
  const { saved } = await searchParams
  const { userId, isAdmin } = await getViewer()
  const data = await getMeme(id, userId)
  if (!data) notFound()
  const { meme, comments } = data
  const path = `/memes/${meme.id}`
  return (
    <article className="max-w-3xl space-y-8">
      <SavedBanner show={saved === '1'} />
      <Link href="/memes" className="text-sm text-text-secondary hover:text-accent-cyan">← All memes</Link>
      <MemeCard meme={meme} userId={userId} isAdmin={isAdmin} detail />
      <div id="comments">
        <CommentsSection kind="meme" targetId={meme.id} comments={comments} userId={userId} path={path} isAdmin={isAdmin} locked={Boolean(meme.is_hidden)} />
      </div>
    </article>
  )
}
