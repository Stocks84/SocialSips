import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'

export const metadata = { title: 'Play' }

const tools = [
  { href: '/play/dice', title: 'Dice', text: 'Roll 1 to 6 dice, with a Mexican mode that scores 21 as the top roll.' },
  { href: '/play/kings-cup', title: 'Kings Cup', text: 'A shuffled deck with every card’s rule, a Kings counter and your own house rules.' },
]

export default function PlayPage() {
  return (
    <>
      <PageHeader title="Play" subtitle="Dice and cards for game night. Works on one phone, no sign-in needed." />
      <ul className="grid gap-4 sm:grid-cols-2">
        {tools.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="card hover:bg-raised p-6 flex items-start gap-4 h-full">
              <span>
                <span className="block text-xl font-bold">{t.title}</span>
                <span className="block text-ink-2 text-sm mt-1">{t.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
