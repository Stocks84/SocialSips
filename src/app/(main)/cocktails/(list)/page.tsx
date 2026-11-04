import Link from 'next/link'
import CocktailCard from '@/components/cocktails/CocktailCard'
import CocktailFilters from '@/components/cocktails/CocktailFilters'
import PageHeader from '@/components/ui/PageHeader'
import Pager from '@/components/ui/Pager'
import { listCocktails } from '@/lib/queries/cocktails'
import { PAGE_SIZE, RPC_MAX_ROWS } from '@/lib/paging'

export const metadata = { title: 'Cocktails' }

export default async function CocktailsPage({ searchParams }: { searchParams: Promise<{ q?: string; af?: string; sort?: string; ing?: string; page?: string }> }) {
  const { q = '', af, sort = 'newest', ing = '', page: pageParam } = await searchParams
  const alcoholFree = af === '1'
  const maxPage = Math.ceil(RPC_MAX_ROWS / PAGE_SIZE) // feed_cocktails caps at 100 rows
  const page = Math.max(1, Math.min(maxPage, Number(pageParam) || 1))
  const rows = await listCocktails({ q, alcoholFree, sort, ing, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE + 1 })
  const cocktails = rows.slice(0, PAGE_SIZE)
  const hasMore = rows.length > PAGE_SIZE && page < maxPage
  const href = (p: number) => {
    const s = new URLSearchParams()
    if (q) s.set('q', q)
    if (ing) s.set('ing', ing)
    if (alcoholFree) s.set('af', '1')
    if (sort !== 'newest') s.set('sort', sort)
    if (p > 1) s.set('page', String(p))
    const qs = s.toString()
    return qs ? `/cocktails?${qs}` : '/cocktails'
  }
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader emoji="🍹" title="Cocktail Recipes" subtitle="Shake, stir, share. Alcohol-free options included." />
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Link href="/cocktails/make" className="btn-secondary text-sm text-center" data-testid="make-link">🧊 What can I make?</Link>
          <Link href="/cocktails/new" className="btn-primary text-sm text-center">+ Add cocktail</Link>
        </div>
      </div>
      <CocktailFilters q={q} alcoholFree={alcoholFree} sort={sort} ing={ing} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cocktails.map((c) => <CocktailCard key={c.id} {...c} />)}
      </div>
      {cocktails.length === 0 && (page > 1
        ? <p className="text-text-secondary">That&apos;s every recipe. <Link href={href(1)} className="text-accent-purple">Back to the start →</Link></p>
        : <p className="text-text-secondary">No cocktails match. Try another search.</p>)}
      <Pager
        label="More cocktails"
        prevHref={page > 1 ? href(page - 1) : null}
        prevText={sort === 'top' ? '← Previous' : '← Newer'}
        nextHref={hasMore ? href(page + 1) : null}
        nextText={sort === 'top' ? 'More →' : 'Older →'}
        testId="cocktails-pager"
      />
    </>
  )
}
