import CocktailCard from '@/components/cocktails/CocktailCard'
import PageHeader from '@/components/ui/PageHeader'
import { listCocktails } from '@/lib/queries/cocktails'

export const metadata = { title: 'Cocktails' }

export default async function CocktailsPage() {
  const cocktails = await listCocktails()
  return (
    <>
      <PageHeader emoji="🍹" title="Cocktail Recipes" subtitle="Shake, stir, share. Alcohol-free options included." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cocktails.map((c) => <CocktailCard key={c.id} {...c} />)}
      </div>
    </>
  )
}
