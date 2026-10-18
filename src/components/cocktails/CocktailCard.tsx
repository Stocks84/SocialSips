import Link from 'next/link'
import Image from 'next/image'
import { isOwnStorageUrl } from '@/lib/storage'
import StarRating from '@/components/ui/StarRating'
import type { CocktailListItem } from '@/lib/queries/cocktails'

export default function CocktailCard({ id, name, description, is_alcohol_free, image_url, avg_rating, rating_count = 0 }: CocktailListItem) {
  return (
    <Link href={`/cocktails/${id}`} className="card card-hover p-5 block" data-testid="cocktail-card">
      {isOwnStorageUrl(image_url) && (
        <Image src={image_url} alt="" width={640} height={360} sizes="(max-width: 768px) 100vw, 33vw" className="rounded-xl mb-3 w-full h-40 object-cover border border-border" />
      )}
      <h3 className="font-bold text-lg text-accent-cyan mb-1">🍸 {name}</h3>
      <p className="text-text-secondary text-sm">{description}</p>
      <div className="flex items-center justify-between mt-3 text-xs">
        {is_alcohol_free ? <span className="badge badge-cyan">Alcohol-free</span> : <span />}
        {avg_rating != null && rating_count > 0 ? (
          <span><StarRating score={Math.round(avg_rating)} /> <span className="text-text-muted">{avg_rating.toFixed(1)} ({rating_count})</span></span>
        ) : (
          <span className="text-text-muted">No ratings yet</span>
        )}
      </div>
    </Link>
  )
}
