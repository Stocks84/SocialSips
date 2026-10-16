import CocktailForm from '@/components/cocktails/CocktailForm'
import PageHeader from '@/components/ui/PageHeader'
import { createCocktail } from '../actions'

export const metadata = { title: 'Add a cocktail' }

export default function NewCocktailPage() {
  return (
    <>
      <PageHeader emoji="🍸" title="Add a cocktail" subtitle="Share your signature serve." />
      <CocktailForm action={createCocktail} submitLabel="Publish cocktail 🍹" />
    </>
  )
}
