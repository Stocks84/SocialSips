import { rate } from '@/lib/actions/social'
import SubmitButton, { PendingNote } from '@/components/ui/SubmitButton'

/** 1–5 star buttons; each is its own submit (works without JS). */
export default function RatingForm({ kind, targetId, myScore }: { kind: 'game' | 'cocktail'; targetId: string; myScore: number | null }) {
  return (
    <form action={rate} className="flex flex-wrap items-center gap-2" aria-label="Rate">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="targetId" value={targetId} />
      {[1, 2, 3, 4, 5].map((n) => (
        <SubmitButton
          key={n}
          name="score"
          value={n}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center text-2xl transition-colors ${myScore && n <= myScore ? 'text-accent' : 'text-ink-3 hover:text-ink'}`}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </SubmitButton>
      ))}
      {myScore && <span className="text-ink-2 text-sm ml-2">You rated {myScore}/5</span>}
      <PendingNote className="text-ink-2 text-sm ml-2" />
    </form>
  )
}
