import Link from 'next/link'
import CocktailCard from '@/components/cocktails/CocktailCard'
import CocktailFilters from '@/components/cocktails/CocktailFilters'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import Pager from '@/components/ui/Pager'
import { listCocktails } from '@/lib/queries/cocktails'
import { encodeCursor, parseCursor, PAGE_SIZE, PAGE_TAKE } from '@/lib/paging'

export const metadata = { title: 'Cocktails' }

export default async function CocktailsPage({ searchParams }: { searchParams: Promise<{ q?: string; af?: string; sort?: string; ing?: string; page?: string; before?: string }> }) {
  const { q = '', af, sort = 'newest', ing = '', page: pageParam, before: beforeParam } = await searchParams
  const alcoholFree = af === '1'
  const top = sort === 'top'
  const before = top ? null : parseCursor(beforeParam)
  const page = top ? Math.max(1, Number(pageParam) || 1) : 1
  const rows = await listCocktails({ q, alcoholFree, sort, ing, before, offset: (page - 1) * PAGE_SIZE, limit: PAGE_TAKE })
  const cocktails = rows.slice(0, PAGE_SIZE)
  const hasMore = rows.length > PAGE_SIZE
  const last = cocktails[cocktails.length - 1]
  const href = (p: { page?: number; before?: string } = {}) => {
    const s = new URLSearchParams()
    if (q) s.set('q', q)
    if (ing) s.set('ing', ing)
    if (alcoholFree) s.set('af', '1')
    if (sort !== 'newest') s.set('sort', sort)
    if (p.page && p.page > 1) s.set('page', String(p.page))
    if (p.before) s.set('before', p.before)
    const qs = s.toString()
    return qs ? `/cocktails?${qs}` : '/cocktails'
  }
  const filtered = Boolean(q || ing || alcoholFree)
  const paged = Boolean(before) || page > 1
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Cocktail Recipes" subtitle="Shake, stir, share. Alcohol-free options included." />
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Link href="/cocktails/make" className="btn-secondary text-sm text-center" data-testid="make-link">What can I make?</Link>
          <Link href="/cocktails/new" className="btn-primary text-sm text-center">+ Add cocktail</Link>
        </div>
      </div>
      <CocktailFilters q={q} alcoholFree={alcoholFree} sort={sort} ing={ing} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cocktails.map((c) => <CocktailCard key={c.id} {...c} />)}
      </div>
      {cocktails.length === 0 && (
        paged ? (
          <EmptyState title="Last call. That's every recipe." action={{ href: href(), label: 'Back to the start' }} testId="cocktails-end" />
        ) : filtered ? (
          <EmptyState title="No cocktails match." action={{ href: '/cocktails', label: 'Clear filters' }} testId="cocktails-empty">
            Try another search or ingredient.
          </EmptyState>
        ) : (
          <EmptyState title="The bar is empty." action={{ href: '/cocktails/new', label: '+ Add a cocktail' }} testId="cocktails-empty">
            No recipes yet. Shake things up and add the first one.
          </EmptyState>
        )
      )}
      {top ? (
        <Pager
          label="More cocktails"
          prevHref={page > 1 ? href({ page: page - 1 }) : null}
          prevText="← Previous"
          nextHref={hasMore ? href({ page: page + 1 }) : null}
          nextText="Load more →"
          testId="cocktails-pager"
        />
      ) : (
        <Pager
          label="More cocktails"
          prevHref={before ? href() : null}
          prevText="↑ Back to the newest"
          nextHref={hasMore && last?.created_at ? href({ before: encodeCursor({ at: last.created_at, id: last.id }) }) : null}
          nextText="Load more →"
          testId="cocktails-pager"
        />
      )}
    </>
  )
}
