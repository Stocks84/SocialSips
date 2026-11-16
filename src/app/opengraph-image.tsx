import { ogCard } from '@/lib/server/og-card'

export const alt = 'Social Sips: drinking games & cocktails'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Site-wide default share image (pages with their own image override it). Static text only; no user content. */
export default function Image() {
  return ogCard({
    kicker: '18+ only',
    title: 'Drinking games & cocktails',
    body: 'Share games and recipes with friends. Rated by hangover severity.',
    footer: 'Play responsibly',
  })
}
