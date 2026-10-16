import { rate } from '@/app/(main)/games/actions'

/** 1–5 star buttons; each is its own submit (works without JS). */
export default function RatingForm({ kind, targetId, myScore }: { kind: 'game' | 'cocktail'; targetId: string; myScore: number | null }) {
  return (
    <form action={rate} className="flex items-center gap-1" aria-label="Rate">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="targetId" value={targetId} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          name="score"
          value={n}
          className={`text-2xl transition-colors ${myScore && n <= myScore ? 'text-accent-cyan' : 'text-text-muted hover:text-accent-cyan'}`}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
      {myScore && <span className="text-text-secondary text-sm ml-2">You rated {myScore}/5</span>}
    </form>
  )
}
