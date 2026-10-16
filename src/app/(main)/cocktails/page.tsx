import CocktailCard from '@/components/cocktails/CocktailCard'
import PageHeader from '@/components/ui/PageHeader'
import { mockCocktails } from '@/lib/mock-data'

export const metadata = { title: 'Cocktails' }

export default function CocktailsPage() {
  return (
    <>
      <PageHeader emoji="🍹" title="Cocktail Recipes" subtitle="Shake, stir, share. Alcohol-free options included." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockCocktails.map((c) => <CocktailCard key={c.id} {...c} />)}
      </div>
    </>
  )
}
