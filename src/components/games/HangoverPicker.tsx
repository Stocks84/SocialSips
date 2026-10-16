import { HANGOVER_LABELS, HANGOVER_RATINGS } from '@/types/database'

/** Radio cards styled with the neon hangover badges. */
export default function HangoverPicker({ name = 'hangoverRating', defaultValue }: { name?: string; defaultValue?: string }) {
  return (
    <fieldset>
      <legend className="label mb-2">Hangover rating</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {HANGOVER_RATINGS.map((r, i) => (
          <label
            key={r}
            className="card p-4 text-center cursor-pointer transition-all has-[:checked]:border-accent-purple has-[:checked]:shadow-neon-purple"
          >
            <input type="radio" name={name} value={r} defaultChecked={defaultValue ? r === defaultValue : i === 0} className="sr-only" />
            <span className="text-3xl block mb-2" aria-hidden="true">{HANGOVER_LABELS[r].emoji}</span>
            <span className={`badge ${HANGOVER_LABELS[r].badge}`}>{HANGOVER_LABELS[r].label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
