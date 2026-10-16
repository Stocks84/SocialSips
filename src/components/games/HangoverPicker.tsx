import { HANGOVER_LABELS, HANGOVER_RATINGS } from '@/types/database'

export default function HangoverPicker({ name = 'hangoverRating' }: { name?: string }) {
  return (
    <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <legend className="label mb-2">Hangover rating</legend>
      {HANGOVER_RATINGS.map((r, i) => (
        <label key={r} className="card p-4 text-center cursor-pointer has-[:checked]:border-accent-purple">
          <input type="radio" name={name} value={r} defaultChecked={i === 0} className="sr-only" />
          <span className="text-3xl block" aria-hidden="true">{HANGOVER_LABELS[r].emoji}</span>
          <span className="text-sm">{HANGOVER_LABELS[r].label}</span>
        </label>
      ))}
    </fieldset>
  )
}
