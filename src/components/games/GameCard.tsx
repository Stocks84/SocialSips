import Link from 'next/link'
import HangoverBadge from '@/components/ui/HangoverBadge'
import StarRating from '@/components/ui/StarRating'
import type { GameListItem } from '@/lib/queries/games'
import { faUsers } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

export default function GameCard({ id, title, summary, hangover_rating, min_players, tags, avg_rating, rating_count }: GameListItem) {
  return (
    <Link href={`/games/${id}`} className="card hover:bg-raised p-5 block" data-testid="game-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-lg">{title}</h3>
        <HangoverBadge rating={hangover_rating} />
      </div>
      <p className="text-ink-2 text-sm mb-3">{summary}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-3"><Icon icon={faUsers} className="text-icon-sm mr-1" />{min_players}+ · {tags.map((t) => `#${t}`).join(' ')}</span>
        <span data-testid="card-rating">
          {avg_rating !== null && rating_count > 0 ? (
            <><StarRating score={Math.round(avg_rating)} /> <span className="text-ink-3">{avg_rating.toFixed(1)} ({rating_count})</span></>
          ) : (
            <span className="text-ink-3">No ratings yet</span>
          )}
        </span>
      </div>
    </Link>
  )
}
