import CocktailForm from '@/components/cocktails/CocktailForm'
import PageHeader from '@/components/ui/PageHeader'
import SuspendedFormBlock from '@/components/ui/SuspendedFormBlock'
import { getViewer } from '@/lib/server/viewer'
import { createCocktail } from '../actions'

export const metadata = { title: 'Add a cocktail' }

export default async function NewCocktailPage() {
  const { suspended } = await getViewer()
  return (
    <>
      <PageHeader title="Add a cocktail" subtitle="Share your signature serve." />
      {suspended ? <SuspendedFormBlock action="add a cocktail" reason={suspended.reason} /> : (
        <CocktailForm action={createCocktail} submitLabel="Publish cocktail" />
      )}
    </>
  )
}
