import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import MakeFinder from '@/components/cocktails/MakeFinder'
import { listMakeableCocktails } from '@/lib/queries/cocktails'

export const metadata = { title: 'What can I make?' }

export default async function MakePage() {
  const cocktails = await listMakeableCocktails()
  return (
    <>
      <Link href="/cocktails" className="text-sm text-text-secondary hover:text-accent-cyan">← All cocktails</Link>
      <div className="mt-3">
        <PageHeader emoji="🧊" title="What can I make?" subtitle="Tick what's in your bar. We'll show what you can make now, and what's one or two bottles away." />
      </div>
      <MakeFinder cocktails={cocktails} />
    </>
  )
}
