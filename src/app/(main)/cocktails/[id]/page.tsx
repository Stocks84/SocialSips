import { notFound } from 'next/navigation'
import ComingSoon from '@/components/ui/ComingSoon'
import { mockCocktails } from '@/lib/mock-data'

export default async function CocktailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = mockCocktails.find((x) => x.id === id)
  if (!c) notFound()
  return (
    <article className="max-w-3xl space-y-6">
      <h1 className="text-4xl font-black gradient-text">{c.name}</h1>
      <p className="text-text-secondary">{c.description}</p>
      <ComingSoon>Ingredients, method, comments and ratings load from Supabase.</ComingSoon>
    </article>
  )
}
