import PageHeader from '@/components/ui/PageHeader'
import PlayToolbar from '@/components/play/PlayToolbar'
import DiceRoller from '@/components/play/DiceRoller'

export const metadata = { title: 'Dice' }

export default function DicePage() {
  return (
    <div className="max-w-xl mx-auto">
      <PlayToolbar />
      <PageHeader emoji="🎲" title="Dice" subtitle="Tap to roll. Switch on Mexican mode for 21s and doubles." />
      <DiceRoller />
    </div>
  )
}
