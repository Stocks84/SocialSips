import Link from 'next/link'

const CHIPS = ['Gin', 'Vodka', 'Rum', 'Tequila', 'Whiskey', 'Lime', 'Lemon', 'Mint']

type Props = { q?: string; alcoholFree?: boolean; sort?: string; ing?: string }

/** Search + ingredient filter + alcohol-free toggle + sort. Plain GET form (?q=&ing=&af=1&sort=). */
export default function CocktailFilters({ q = '', alcoholFree = false, sort = 'newest', ing = '' }: Props) {
  const chipHref = (value: string) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (value) p.set('ing', value)
    if (alcoholFree) p.set('af', '1')
    if (sort !== 'newest') p.set('sort', sort)
    const s = p.toString()
    return s ? `/cocktails?${s}` : '/cocktails'
  }
  const active = ing.trim().toLowerCase()
  return (
    <div className="mb-6 space-y-3">
      <form className="flex flex-col sm:flex-row sm:items-center gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Search names, ingredients…" className="input flex-1" aria-label="Search cocktails" />
        <input name="ing" defaultValue={ing} placeholder="Ingredient, e.g. lime" className="input sm:w-48" aria-label="Filter by ingredient" maxLength={40} />
        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
          <input type="checkbox" name="af" value="1" defaultChecked={alcoholFree} className="accent-accent" /> Alcohol-free only
        </label>
        <select name="sort" defaultValue={sort} className="input sm:w-40" aria-label="Sort">
          <option value="newest">Newest</option>
          <option value="top">Top rated</option>
        </select>
        <button className="btn-primary">Go</button>
      </form>
      <div className="flex flex-wrap gap-2" aria-label="Filter by ingredient" data-testid="ingredient-chips">
        {CHIPS.map((c) => {
          const on = active === c.toLowerCase()
          return (
            <Link
              key={c}
              href={chipHref(on ? '' : c.toLowerCase())}
              className="group inline-flex min-h-11 min-w-11 items-center justify-center px-1"
              aria-pressed={on}
            >
              <span className={`chip ${on ? 'border-accent bg-raised text-ink' : ''} group-hover:text-ink`}>{on ? '✓ ' : ''}{c}</span>
            </Link>
          )
        })}
        {active && <Link href={chipHref('')} className="inline-flex min-h-11 items-center px-1 text-xs text-ink-3 hover:text-ink">Clear ingredient</Link>}
      </div>
    </div>
  )
}
