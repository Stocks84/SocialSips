import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import ChallengeView from '@/components/challenge/ChallengeView'
import { getChallenge, getCurrentChallenge } from '@/lib/queries/challenges'
import { UUID } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = UUID.test(id) ? await getChallenge(id) : null
  return { title: c ? `${c.theme} · Weekly challenge` : 'Weekly challenge' }
}

export default async function ChallengeDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, { error }] = await Promise.all([params, searchParams])
  if (!UUID.test(id)) notFound()
  const [c, cur] = await Promise.all([getChallenge(id), getCurrentChallenge()])
  if (!c) notFound()
  if (cur?.id === c.id && !error) redirect('/challenge')
  return (
    <>
      <Link href="/challenge" className="text-sm text-text-secondary hover:text-accent-cyan">← This week&apos;s challenge</Link>
      <div className="mt-3"><ChallengeView c={c} current={false} error={error?.slice(0, 200)} /></div>
    </>
  )
}
