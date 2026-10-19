import Link from 'next/link'
import { headers } from 'next/headers'
import { PREVIEW_HEADER } from '@/lib/preview'
import { notFound } from 'next/navigation'
import MemeCard from '@/components/memes/MemeCard'
import CommentsSection from '@/components/social/CommentsSection'
import SavedBanner from '@/components/ui/SavedBanner'
import { getViewer } from '@/lib/server/viewer'
import { getMeme } from '@/lib/queries/memes'

import type { Metadata } from 'next'
import { isOwnStorageUrl } from '@/lib/storage'
import { siteOrigin, snippet } from '@/lib/server/share'

/** Share preview (Open Graph / Twitter). Built from the anonymous view, so hidden memes give no preview. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const data = await getMeme(id, null)
  if (!data) return { title: 'Meme not found', robots: { index: false } }
  const m = data.meme
  const origin = await siteOrigin()
  const title = snippet(m.caption ?? m.joke_text ?? 'A meme', 70)
  const description = snippet(m.caption && m.joke_text ? m.joke_text : 'Party-approved laughs from the Social Sips community. 18+ only.', 160)
  const image = isOwnStorageUrl(m.image_url) ? m.image_url : `${origin}/memes/${m.id}/og`
  const url = `${origin}/memes/${m.id}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'article', siteName: 'Social Sips', title, description, url, images: [{ url: image, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function MemePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params
  const { saved } = await searchParams
  if ((await headers()).get(PREVIEW_HEADER) === '1') {
    // Link-preview bot: the share tags come from generateMetadata; the body stays a stub.
    const data = await getMeme(id, null)
    if (!data) notFound()
    return (
      <article className="max-w-3xl space-y-4" data-testid="preview-stub">
        <p className="font-semibold text-lg">{data.meme.caption ?? 'A meme on Social Sips'}</p>
        <Link href={`/memes/${data.meme.id}`} className="btn-primary text-sm">Open on Social Sips (18+)</Link>
      </article>
    )
  }
  const { userId, isAdmin } = await getViewer()
  const data = await getMeme(id, userId, isAdmin)
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
