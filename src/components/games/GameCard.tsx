import Link from 'next/link'
import HangoverBadge from '@/components/ui/HangoverBadge'
import type { Game } from '@/types/database'

type Props = Pick<Game, 'id' | 'title' | 'summary' | 'hangover_rating' | 'min_players' | 'tags'>

export default function GameCard({ id, title, summary, hangover_rating, min_players, tags }: Props) {
  return (
    <Link href={`/games/${id}`} className="card card-hover p-5 block">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-lg">{title}</h3>
        <HangoverBadge rating={hangover_rating} />
      </div>
      <p className="text-text-secondary text-sm mb-3">{summary}</p>
      <p className="text-text-muted text-xs">👥 {min_players}+ players · {tags.map((t) => `#${t}`).join(' ')}</p>
    </Link>
  )
}
