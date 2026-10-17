import Image from 'next/image'
import { isOwnStorageUrl } from '@/lib/storage'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import HangoverBadge from '@/components/ui/HangoverBadge'
import StarRating from '@/components/ui/StarRating'
import ReportButton from '@/components/ui/ReportButton'
import CommentsSection from '@/components/social/CommentsSection'
import RatingForm from '@/components/social/RatingForm'
import SignInPrompt from '@/components/social/SignInPrompt'
import VariationsSection from '@/components/social/VariationsSection'
import { getGameDetail } from '@/lib/queries/games'
import { getViewer } from '@/lib/server/viewer'
import AdminControls from '@/components/admin/AdminControls'

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getGameDetail(id)
  if (!detail) notFound()
  const { game, comments, variations, rating, userId } = detail
  const { isAdmin } = await getViewer()
  const path = `/games/${game.id}`
  const isOwner = Boolean(userId && game.author_id === userId)
  const players = game.max_players ? `${game.min_players}–${game.max_players}` : `${game.min_players}+`

  return (
    <article className="space-y-10 max-w-3xl">
      <header>
        {isOwnStorageUrl(game.cover_image_url) && (
          <Image src={game.cover_image_url} alt="" width={1200} height={630} className="rounded-2xl mb-6 w-full h-64 object-cover border border-border" />
        )}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-black mb-3">{game.title}</h1>
          {isOwner ? (
            <Link href={`${path}/edit`} className="btn-secondary text-sm py-2 px-4 shrink-0">✏️ Edit</Link>
          ) : userId ? (
            <ReportButton targetType="game" targetId={game.id} />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <HangoverBadge rating={game.hangover_rating} />
          <span className="text-text-secondary text-sm">👥 {players} players</span>
          {rating.avg !== null && (
            <span className="text-sm"><StarRating score={Math.round(rating.avg)} /> <span className="text-text-muted">({rating.count})</span></span>
          )}
        </div>
        {isAdmin && <div className="mt-3"><AdminControls type="game" id={game.id} redirectTo="/feed" /></div>}
        <p className="text-text-secondary mt-4">{game.summary}</p>
        <p className="text-text-muted text-xs mt-2">
          {game.author && <>by <Link href={`/profile/${game.author.username}`} className="text-accent-purple">@{game.author.username}</Link> · </>}
          {game.tags.map((t) => `#${t}`).join(' ')}
        </p>
      </header>

      <section>
        <h2 className="text-xl font-bold mb-3 text-accent-purple">📜 Original rules</h2>
        {game.equipment.length > 0 && <p className="text-sm text-text-secondary mb-3">🧰 You need: {game.equipment.join(', ')}</p>}
        <p className="card p-5 whitespace-pre-line">{game.rules ?? 'Rules load from Supabase.'}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3 text-accent-cyan">⭐ Rate it</h2>
        {userId ? <RatingForm kind="game" targetId={game.id} myScore={rating.mine} /> : <SignInPrompt path={path} what="rate this game" />}
      </section>

      <VariationsSection kind="game" targetId={game.id} variations={variations} userId={userId} path={path} isAdmin={isAdmin} />

      <CommentsSection kind="game" targetId={game.id} comments={comments} userId={userId} path={path} isAdmin={isAdmin} />
    </article>
  )
}
