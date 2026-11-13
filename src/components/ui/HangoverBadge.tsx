import { HANGOVER_LABELS, type HangoverRating } from '@/types/database'

/** The single hangover meter: three 8px pips (filled = level colour, empty = line ring). Decorative; the label carries the meaning. */
export function HangoverPips({ rating }: { rating: HangoverRating }) {
  const h = HANGOVER_LABELS[rating]
  return (
    <span className="inline-flex shrink-0 items-center gap-1" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span key={n} className={`size-2 rounded-full ${n <= h.pips ? h.pipClass : 'border border-line'}`} />
      ))}
    </span>
  )
}

export default function HangoverBadge({ rating }: { rating: HangoverRating }) {
  const h = HANGOVER_LABELS[rating]
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap text-meta font-semibold ${h.textClass}`}>
      <HangoverPips rating={rating} />
      {h.label}
    </span>
  )
}
