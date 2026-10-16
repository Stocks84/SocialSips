import PageHeader from '@/components/ui/PageHeader'
import ComingSoon from '@/components/ui/ComingSoon'

export const metadata = { title: 'Jokes & Memes' }

export default function MemesPage() {
  return (
    <>
      <PageHeader emoji="😂" title="Jokes & Memes" subtitle="Party-approved laughs from the community." />
      <div className="card p-6 mb-6">
        <p className="text-lg">Why did the cocktail go to therapy? 🍸</p>
        <p className="text-accent-pink mt-1">It had too many mixed feelings.</p>
      </div>
      <ComingSoon>Meme uploads (Supabase Storage) coming in V1.</ComingSoon>
    </>
  )
}
