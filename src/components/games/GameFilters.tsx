import { HANGOVER_LABELS, HANGOVER_RATINGS } from '@/types/database'

/** Search + hangover filter. Uses a plain GET form so it works without JS (?q=&hangover=). */
export default function GameFilters({ q = '', hangover = '' }: { q?: string; hangover?: string }) {
  return (
    <form className="flex flex-col sm:flex-row gap-3 mb-6" role="search">
      <input name="q" defaultValue={q} placeholder="Search games…" className="input flex-1" aria-label="Search games" />
      <select name="hangover" defaultValue={hangover} className="input sm:w-56" aria-label="Hangover rating">
        <option value="">All hangover levels</option>
        {HANGOVER_RATINGS.map((r) => (
          <option key={r} value={r}>{HANGOVER_LABELS[r].emoji} {HANGOVER_LABELS[r].label}</option>
        ))}
      </select>
      <button className="btn-primary">Filter</button>
    </form>
  )
}
