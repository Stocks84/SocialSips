import { getSharedGame } from '@/lib/queries/share'
import { ogCard } from '@/lib/server/og-card'
import { HANGOVER_LABELS, type HangoverRating } from '@/types/database'

/** 1200×630 share image for a game. Hidden/missing → 404 (anonymous view only). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await getSharedGame(id)
  if (!g) return new Response('Not found', { status: 404 })
  const players = g.max_players ? `${g.min_players}–${g.max_players}` : `${g.min_players}+`
  const hangover = HANGOVER_LABELS[g.hangover_rating as HangoverRating]?.label
  return ogCard({ kicker: 'Drinking game', title: g.title, body: g.summary, footer: [`${players} players`, hangover, '18+'].filter(Boolean).join(' · ') })
}
