import { rateGame } from '@/app/(main)/games/actions'

/** 1–5 star buttons; each is its own submit (works without JS). */
export default function RatingForm({ gameId, myScore }: { gameId: string; myScore: number | null }) {
  return (
    <form action={rateGame} className="flex items-center gap-1" aria-label="Rate this game">
      <input type="hidden" name="gameId" value={gameId} />
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
