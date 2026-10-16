import { HANGOVER_LABELS, type HangoverRating } from '@/types/database'

export default function HangoverBadge({ rating }: { rating: HangoverRating }) {
  const h = HANGOVER_LABELS[rating]
  return (
    <span className={`badge ${h.badge}`}>
      <span aria-hidden="true">{h.emoji}</span> {h.label}
    </span>
  )
}
