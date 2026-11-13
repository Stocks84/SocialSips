import { HANGOVER_RATINGS } from '@/types/database'
import HangoverBadge from '@/components/ui/HangoverBadge'

/** Radio cards showing the hangover meter. */
export default function HangoverPicker({ name = 'hangoverRating', defaultValue }: { name?: string; defaultValue?: string }) {
  return (
    <fieldset>
      <legend className="label mb-2">Hangover rating</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {HANGOVER_RATINGS.map((r, i) => (
          <label
            key={r}
            className="card p-4 text-center cursor-pointer transition-colors has-[:checked]:border-accent has-[:checked]:bg-raised has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
          >
            <input type="radio" name={name} value={r} defaultChecked={defaultValue ? r === defaultValue : i === 0} className="sr-only" />
            <HangoverBadge rating={r} />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
