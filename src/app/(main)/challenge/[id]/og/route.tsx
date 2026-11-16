import { getSharedChallenge } from '@/lib/queries/share'
import { KIND_LABEL, weekLabel } from '@/lib/challenge'
import { ogCard } from '@/lib/server/og-card'

/** 1200×630 share image for a weekly challenge. Missing → 404. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await getSharedChallenge(id)
  if (!c) return new Response('Not found', { status: 404 })
  return ogCard({ kicker: 'Weekly challenge', title: c.theme, body: c.description, footer: `${KIND_LABEL[c.kind]} · ${weekLabel(c.starts_on)} · 18+` })
}
