import PageHeader from '@/components/ui/PageHeader'
import PlayToolbar from '@/components/play/PlayToolbar'
import KingsCup from '@/components/play/KingsCup'

export const metadata = { title: 'Kings Cup' }

export default function KingsCupPage() {
  return (
    <div className="max-w-xl mx-auto">
      <PlayToolbar />
      <PageHeader emoji="👑" title="Kings Cup" subtitle="Tap the deck to draw. Each card has a rule; the 4th King ends in the cup." />
      <KingsCup />
    </div>
  )
}
