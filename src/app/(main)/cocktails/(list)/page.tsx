import Link from 'next/link'
import CocktailCard from '@/components/cocktails/CocktailCard'
import CocktailFilters from '@/components/cocktails/CocktailFilters'
import PageHeader from '@/components/ui/PageHeader'
import { listCocktails } from '@/lib/queries/cocktails'

export const metadata = { title: 'Cocktails' }

export default async function CocktailsPage({ searchParams }: { searchParams: Promise<{ q?: string; af?: string; sort?: string; ing?: string }> }) {
  const { q = '', af, sort = 'newest', ing = '' } = await searchParams
  const alcoholFree = af === '1'
  const cocktails = await listCocktails({ q, alcoholFree, sort, ing })
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
      {cocktails.length === 0 && <p className="text-text-secondary">No cocktails match. Try another search.</p>}
    </>
  )
}
