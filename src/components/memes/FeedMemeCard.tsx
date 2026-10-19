import Image from 'next/image'
import Link from 'next/link'
import { isOwnStorageUrl } from '@/lib/storage'
import type { MemeWithStats } from '@/lib/queries/memes'

/** Compact meme card for the main feed; links to the meme's page. */
export default function FeedMemeCard({ meme: m }: { meme: MemeWithStats }) {
  const total = Object.values(m.stats.reactions).reduce((a, b) => a + b, 0)
  const top = Object.entries(m.stats.reactions).sort((a, b) => b[1] - a[1])[0]?.[0]
  return (
    <Link href={`/memes/${m.id}`} className="card card-hover overflow-hidden block" data-testid="feed-meme">
      {isOwnStorageUrl(m.image_url) && (
        <Image src={m.image_url} alt={m.caption ?? 'Meme'} width={600} height={400} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="w-full h-40 object-cover" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-lg">{m.caption ?? 'Meme'}</h3>
          <span className="badge badge-pink shrink-0">😂 Meme</span>
        </div>
        {m.joke_text && <p className="text-text-secondary text-sm mb-3 line-clamp-3">{m.joke_text}</p>}
        <p className="text-xs text-text-muted">
          @{m.author?.username ?? 'someone'} · {total ? `${top ?? ''} ${total} reaction${total === 1 ? '' : 's'}` : 'No reactions yet'} · 💬 {m.stats.comment_count}
        </p>
      </div>
    </Link>
  )
}
