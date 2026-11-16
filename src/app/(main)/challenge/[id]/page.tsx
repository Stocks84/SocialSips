import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import ChallengeView from '@/components/challenge/ChallengeView'
import { getChallenge, getCurrentChallenge } from '@/lib/queries/challenges'
import { UUID } from '@/lib/server/auth'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { PREVIEW_HEADER } from '@/lib/preview'
import { KIND_LABEL, weekLabel } from '@/lib/challenge'
import { getSharedChallenge } from '@/lib/queries/share'
import { siteOrigin } from '@/lib/server/share'
import { buildShareMetadata, NOT_FOUND_META, snippet } from '@/lib/share-meta'

export const dynamic = 'force-dynamic'

/** Share preview (Open Graph / Twitter). Challenges are public rows; a missing id gets generic metadata. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const c = await getSharedChallenge(id)
  if (!c) return NOT_FOUND_META
  const origin = siteOrigin()
  return buildShareMetadata({
    origin, path: `/challenge/${c.id}`,
    title: `${snippet(c.theme, 60)} · Weekly challenge`,
    description: snippet(c.description, 160) || `${KIND_LABEL[c.kind]} challenge, ${weekLabel(c.starts_on)}. Enter and vote on Social Sips. 18+ only.`,
    image: `${origin}/challenge/${c.id}/og`,
  })
}

export default async function ChallengeDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, { error }] = await Promise.all([params, searchParams])
  if (!UUID.test(id)) notFound()
  if ((await headers()).get(PREVIEW_HEADER) === '1') {
    // Link-preview bot (no age cookie): the share tags come from generateMetadata; the body stays a stub (no entries, no redirect).
    const c = await getSharedChallenge(id)
    if (!c) notFound()
    return (
      <div className="max-w-3xl space-y-4" data-testid="preview-stub">
        <p className="font-semibold text-lg">{c.theme}</p>
        <Link href={`/challenge/${c.id}`} className="btn-primary text-sm">Open on Social Sips (18+)</Link>
      </div>
    )
  }
  const [c, cur] = await Promise.all([getChallenge(id), getCurrentChallenge()])
  if (!c) notFound()
  if (cur?.id === c.id && !error) redirect('/challenge')
  return (
    <>
      <Link href="/challenge" className="text-sm text-ink-2 hover:text-ink">← This week&apos;s challenge</Link>
      <div className="mt-3"><ChallengeView c={c} current={false} error={error?.slice(0, 200)} /></div>
    </>
  )
}
