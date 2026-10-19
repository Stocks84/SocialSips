import Link from 'next/link'
import ChallengeView from '@/components/challenge/ChallengeView'
import ComingSoon from '@/components/ui/ComingSoon'
import { getCurrentChallenge, listChallenges } from '@/lib/queries/challenges'
import { weekLabel } from '@/lib/challenge'

export const metadata = { title: 'Weekly challenge' }
export const dynamic = 'force-dynamic'

export default async function ChallengePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const c = await getCurrentChallenge()
  if (!c) return <ComingSoon />
  const past = await listChallenges({ before: c.starts_on, limit: 12 })
  return (
    <>
      <ChallengeView c={c} current error={error?.slice(0, 200)} />
      {past.length > 0 && (
        <section className="mt-10" data-testid="past-challenges">
          <h2 className="text-xl font-bold mb-3">Past challenges</h2>
          <ul className="space-y-2">{past.map((p) => (
            <li key={p.id}><Link href={`/challenge/${p.id}`} className="card card-hover p-4 flex justify-between gap-3"><span className="font-semibold">🏆 {p.theme}</span><span className="text-text-muted text-sm">{weekLabel(p.starts_on)}</span></Link></li>
          ))}</ul>
        </section>
      )}
    </>
  )
}
