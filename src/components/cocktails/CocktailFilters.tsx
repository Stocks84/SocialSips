/** Search + alcohol-free toggle + sort. Plain GET form (?q=&af=1&sort=). */
export default function CocktailFilters({ q = '', alcoholFree = false, sort = 'newest' }: { q?: string; alcoholFree?: boolean; sort?: string }) {
  return (
    <form className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6" role="search">
      <input name="q" defaultValue={q} placeholder="Search names, ingredients…" className="input flex-1" aria-label="Search cocktails" />
      <label className="flex items-center gap-2 text-sm whitespace-nowrap">
        <input type="checkbox" name="af" value="1" defaultChecked={alcoholFree} className="accent-accent-cyan" /> 🌱 Alcohol-free only
      </label>
      <select name="sort" defaultValue={sort} className="input sm:w-40" aria-label="Sort">
        <option value="newest">🆕 Newest</option>
        <option value="top">⭐ Top rated</option>
      </select>
      <button className="btn-primary">Go</button>
    </form>
  )
}
