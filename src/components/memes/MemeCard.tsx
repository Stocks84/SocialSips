import Image from 'next/image'
import Link from 'next/link'
import { isOwnStorageUrl } from '@/lib/storage'
import { formatDate } from '@/lib/format'
import ReportButton from '@/components/ui/ReportButton'
import HiddenNotice from '@/components/ui/HiddenNotice'
import ConfirmSubmit from '@/components/ui/ConfirmSubmit'
import AdminControls from '@/components/admin/AdminControls'
import Reactions from './Reactions'
import { deleteMeme } from '@/app/(main)/memes/actions'
import type { MemeWithStats } from '@/lib/queries/memes'

type Props = { meme: MemeWithStats; userId: string | null; isAdmin: boolean; detail?: boolean }

/** A meme with reactions. In the list it links to its own page (with the comment count). */
export default function MemeCard({ meme: m, userId, isAdmin, detail = false }: Props) {
  const path = `/memes/${m.id}`
  const img = isOwnStorageUrl(m.image_url) && (
    <Image src={m.image_url} alt={m.caption ?? 'Meme'} width={1200} height={900} sizes={detail ? '(min-width: 768px) 768px, 100vw' : '(min-width: 640px) 50vw, 100vw'} className="w-full h-auto" priority={detail} />
  )
  return (
    <figure id={`meme-${m.id}`} className="card overflow-hidden" data-testid="meme">
      {img && (detail ? img : <Link href={path} aria-label="Open meme">{img}</Link>)}
      <figcaption className="p-4 space-y-3">
        {m.is_hidden && <HiddenNotice />}
        {m.caption && (detail ? <p className="font-semibold text-lg">{m.caption}</p> : <Link href={path} className="font-semibold block hover:text-accent-cyan">{m.caption}</Link>)}
        {m.joke_text && <p className="whitespace-pre-line text-accent-pink">{m.joke_text}</p>}
        {m.is_hidden ? (
          <HiddenNotice locked />
        ) : (
          <Reactions memeId={m.id} counts={m.stats.reactions} mine={m.stats.mine} signedIn={Boolean(userId)} path={path} />
        )}
        <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
          <span>
            @{m.author?.username ?? 'someone'} · {formatDate(m.created_at)}
            {!detail && <> · <Link href={`${path}#comments`} className="hover:text-accent-cyan" data-testid="comment-count">💬 {m.stats.comment_count}</Link></>}
          </span>
          {m.author_id === userId ? (
            <span className="flex gap-3">
              {!m.is_hidden && <Link href={`${path}/edit`} className="hover:text-accent-cyan">Edit</Link>}
              <form action={deleteMeme}>
                <input type="hidden" name="memeId" value={m.id} />
                <ConfirmSubmit message="Delete this meme? There's no undo." className="hover:text-accent-pink" label="Delete meme">Delete</ConfirmSubmit>
              </form>
            </span>
          ) : userId ? (
            <ReportButton targetType="meme" targetId={m.id} />
          ) : null}
        </div>
        {isAdmin && <AdminControls type="meme" id={m.id} compact redirectTo={detail ? '/memes' : undefined} />}
      </figcaption>
    </figure>
  )
}
