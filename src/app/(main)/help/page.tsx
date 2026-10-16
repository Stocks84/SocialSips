import PageHeader from '@/components/ui/PageHeader'

export const metadata = { title: 'Help & Responsibility' }

const tips = [
  'Know your limits, and pace yourself. Alternate with water.',
  'Eat before and while drinking.',
  'Never drink and drive. Plan your ride home.',
  'Nobody has to drink to play: every game works with soft drinks.',
  'Look out for your friends. If someone is unwell, get help.',
]

export default function HelpPage() {
  return (
    <>
      <PageHeader emoji="🙏" title="Help & Responsibility" subtitle="Fun is better when everyone gets home safe." />
      <ul className="card p-6 space-y-3 mb-6">
        {tips.map((t) => <li key={t}>✅ {t}</li>)}
      </ul>
      <div className="card-glass p-6 space-y-2 text-sm">
        <h2 className="font-bold text-lg mb-2">Need support?</h2>
        <p>🇬🇧 Drinkaware: drinkaware.co.uk · Drinkline 0300 123 1110</p>
        <p>🇦🇹 Alkohol-Hotline / Suchtberatung: suchtvorbeugung.at</p>
        <p>🚑 In an emergency call 112 (EU) or 999 (UK).</p>
      </div>
    </>
  )
}
