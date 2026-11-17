import Link from 'next/link'
import ChallengeView from '@/components/challenge/ChallengeView'
import ComingSoon from '@/components/ui/ComingSoon'
import { getCurrentChallenge, listChallenges } from '@/lib/queries/challenges'
import { challengeShareInput, weekLabel } from '@/lib/challenge'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { PREVIEW_HEADER } from '@/lib/preview'
import { getSharedCurrentChallenge } from '@/lib/queries/share'
import { siteOrigin } from '@/lib/server/share'
import { challengePageMetadata } from '@/lib/share-meta'
export const dynamic = 'force-dynamic'

/** Share preview (Open Graph / Twitter) for this week's challenge; falls back to a generic card if none is active. */
export async function generateMetadata(): Promise<Metadata> {
  const c = await getSharedCurrentChallenge()
  return challengePageMetadata(siteOrigin(), c ? challengeShareInput(c) : null)
}

export default async function ChallengePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const c = await getCurrentChallenge()
  if (!c) return <ComingSoon />
  if ((await headers()).get(PREVIEW_HEADER) === '1') {
    // Link-preview bot (no age cookie): the share tags come from generateMetadata; the body stays a stub (no board, no entries).
    return (
      <div className="max-w-3xl space-y-4" data-testid="preview-stub">
        <p className="font-semibold text-lg">{c.theme}</p>
        <Link href="/challenge" className="btn-primary text-sm">Open on Social Sips (18+)</Link>
      </div>
    )
  }
  const past = await listChallenges({ before: c.starts_on, limit: 12 })
  return (
    <>
      <ChallengeView c={c} current error={error?.slice(0, 200)} />
      {past.length > 0 && (
        <section className="mt-10" data-testid="past-challenges">
          <h2 className="text-xl font-bold mb-3">Past challenges</h2>
          <ul className="space-y-2">{past.map((p) => (
            <li key={p.id}><Link href={`/challenge/${p.id}`} className="card hover:bg-raised p-4 flex justify-between gap-3"><span className="font-semibold">{p.theme}</span><span className="text-ink-3 text-sm">{weekLabel(p.starts_on)}</span></Link></li>
          ))}</ul>
        </section>
      )}
    </>
  )
}
