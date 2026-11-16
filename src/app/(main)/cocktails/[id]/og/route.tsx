import { getSharedCocktail } from '@/lib/queries/share'
import { ogCard } from '@/lib/server/og-card'

/** 1200×630 share image for a cocktail. Hidden/missing → 404 (anonymous view only). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await getSharedCocktail(id)
  if (!c) return new Response('Not found', { status: 404 })
  return ogCard({ kicker: 'Cocktail', title: c.name, body: c.description, footer: `${c.is_alcohol_free ? 'Alcohol-free · ' : ''}Cocktails · 18+` })
}
