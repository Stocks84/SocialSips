import { notFound, redirect } from 'next/navigation'
import CocktailForm from '@/components/cocktails/CocktailForm'
import PageHeader from '@/components/ui/PageHeader'
import { getViewer } from '@/lib/server/viewer'
import SuspendedFormBlock from '@/components/ui/SuspendedFormBlock'
import { getCocktailDetail } from '@/lib/queries/cocktails'
import { deleteCocktail, updateCocktail } from '../../actions'
import SubmitButton from '@/components/ui/SubmitButton'

export const metadata = { title: 'Edit drink' }

export default async function EditCocktailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getCocktailDetail(id)
  if (!detail) notFound()
  const c = detail.cocktail
  const { suspended } = await getViewer()
  if (!detail.userId || c.author_id !== detail.userId) redirect(`/cocktails/${id}`)
  return (
    <>
      <PageHeader title="Edit drink" subtitle={c.name} />
      {suspended ? <SuspendedFormBlock action="edit this drink" reason={suspended.reason} /> : c.is_hidden ? <p className="card p-4 text-sm text-ink-2 max-w-2xl" data-testid="edit-locked">A moderator has hidden this post, so it can&apos;t be edited right now.</p> : <CocktailForm action={updateCocktail} submitLabel="Save changes" defaults={{ ...c, method: c.method ?? '', ingredients: c.ingredients ?? undefined }} />}
      <form action={deleteCocktail} className="card p-6 mt-8 max-w-2xl">
        <input type="hidden" name="cocktailId" value={c.id} />
        <h2 className="font-bold text-accent mb-2">Danger zone</h2>
        <p className="text-ink-2 text-sm mb-4">Deletes the drink, its photo, variations, comments and ratings. No undo.</p>
        <label className="flex items-center gap-2 text-sm mb-4">
          <input type="checkbox" required className="accent-accent" /> Yes, delete this drink
        </label>
        <SubmitButton className="btn-danger" pendingLabel="Deleting…">Delete drink</SubmitButton>
      </form>
    </>
  )
}
