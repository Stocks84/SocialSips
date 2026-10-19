import { notFound, redirect } from 'next/navigation'
import CocktailForm from '@/components/cocktails/CocktailForm'
import PageHeader from '@/components/ui/PageHeader'
import { getCocktailDetail } from '@/lib/queries/cocktails'
import { deleteCocktail, updateCocktail } from '../../actions'

export const metadata = { title: 'Edit cocktail' }

export default async function EditCocktailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getCocktailDetail(id)
  if (!detail) notFound()
  const c = detail.cocktail
  if (!detail.userId || c.author_id !== detail.userId) redirect(`/cocktails/${id}`)
  return (
    <>
      <PageHeader emoji="✏️" title="Edit cocktail" subtitle={c.name} />
      {c.is_hidden ? <p className="card-glass p-4 text-sm text-text-secondary max-w-2xl" data-testid="edit-locked">🙈 A moderator has hidden this post, so it can&apos;t be edited right now.</p> : <CocktailForm action={updateCocktail} submitLabel="Save changes" defaults={{ ...c, method: c.method ?? '' }} />}
      <form action={deleteCocktail} className="card p-6 mt-8 max-w-2xl">
        <input type="hidden" name="cocktailId" value={c.id} />
        <h2 className="font-bold text-accent-pink mb-2">Danger zone</h2>
        <p className="text-text-secondary text-sm mb-4">Deletes the cocktail, its photo, variations, comments and ratings. No undo.</p>
        <label className="flex items-center gap-2 text-sm mb-4">
          <input type="checkbox" required className="accent-accent-pink" /> Yes, delete this cocktail
        </label>
        <button className="btn-danger">Delete cocktail</button>
      </form>
    </>
  )
}
