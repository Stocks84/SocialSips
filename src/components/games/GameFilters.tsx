import { HANGOVER_LABELS, HANGOVER_RATINGS } from '@/types/database'

/** Search + hangover filter + sort. Plain GET form so it works without JS (?q=&hangover=&sort=). */
export default function GameFilters({ q = '', hangover = '', sort = 'newest' }: { q?: string; hangover?: string; sort?: string }) {
  return (
    <form className="flex flex-col sm:flex-row gap-3 mb-6" role="search">
      <input name="q" defaultValue={q} placeholder="Search names, rules, tags…" className="input flex-1" aria-label="Search games" />
      <select name="hangover" defaultValue={hangover} className="input sm:w-52" aria-label="Hangover rating">
        <option value="">All hangover levels</option>
        {HANGOVER_RATINGS.map((r) => (
          <option key={r} value={r}>{HANGOVER_LABELS[r].emoji} {HANGOVER_LABELS[r].label}</option>
        ))}
      </select>
      <select name="sort" defaultValue={sort} className="input sm:w-40" aria-label="Sort">
        <option value="newest">🆕 Newest</option>
        <option value="top">⭐ Top rated</option>
      </select>
      <button className="btn-primary">Go</button>
    </form>
  )
}
