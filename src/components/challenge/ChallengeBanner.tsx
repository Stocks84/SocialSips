import Link from 'next/link'
import { getCurrentChallenge } from '@/lib/queries/challenges'
import { KIND_LABEL } from '@/lib/challenge'

/** Feed banner for this week's challenge. */
export default async function ChallengeBanner() {
  const c = await getCurrentChallenge()
  if (!c) return null
  return (
    <Link href="/challenge" className="card hover:bg-raised p-4 mb-6 flex flex-wrap items-center justify-between gap-3" data-testid="challenge-banner">
      <span><span className="chip mr-2">This week</span><strong>{c.theme}</strong> <span className="text-ink-2 text-sm">· {KIND_LABEL[c.kind]}s</span></span>
      <span className="text-accent text-sm font-semibold">Enter &amp; vote →</span>
    </Link>
  )
}
