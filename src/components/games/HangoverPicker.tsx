import { HANGOVER_RATINGS } from '@/types/database'
import HangoverBadge from '@/components/ui/HangoverBadge'

/** Radio cards showing the hangover meter. Controlled so a form reset cannot drop the choice. */
export default function HangoverPicker({
  name = 'hangoverRating',
  value,
  onChange,
}: {
  name?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <fieldset>
      <legend className="label mb-2">Hangover rating</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {HANGOVER_RATINGS.map((r) => (
          <label
            key={r}
            className="card p-4 min-h-11 text-center cursor-pointer transition-colors has-[:checked]:border-accent has-[:checked]:bg-raised has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
          >
            <input type="radio" name={name} value={r} checked={value === r} onChange={() => onChange(r)} className="sr-only" />
            <HangoverBadge rating={r} />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
