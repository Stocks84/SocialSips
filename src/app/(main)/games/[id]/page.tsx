import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import HangoverBadge from '@/components/ui/HangoverBadge'
import StarRating from '@/components/ui/StarRating'
import CommentForm from '@/components/games/CommentForm'
import RatingForm from '@/components/games/RatingForm'
import VariationForm from '@/components/games/VariationForm'
import { deleteComment, deleteVariation } from '../actions'
import { getGameDetail } from '@/lib/queries/games'

const when = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function SignInPrompt({ id, what }: { id: string; what: string }) {
  return (
    <p className="card-glass p-4 text-sm text-text-secondary">
      <Link href={`/sign-in?redirectTo=/games/${id}`} className="text-accent-purple font-medium">Sign in</Link> to {what}.
    </p>
  )
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getGameDetail(id)
  if (!detail) notFound()
  const { game, comments, variations, rating, userId } = detail
  const players = game.max_players ? `${game.min_players}–${game.max_players}` : `${game.min_players}+`

  return (
    <article className="space-y-10 max-w-3xl">
      <header>
        {game.cover_image_url && (
          <Image src={game.cover_image_url} alt="" width={1200} height={630} className="rounded-2xl mb-6 w-full h-64 object-cover border border-border" />
        )}
        <h1 className="text-4xl font-black mb-3">{game.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <HangoverBadge rating={game.hangover_rating} />
          <span className="text-text-secondary text-sm">👥 {players} players</span>
          {rating.avg !== null && (
            <span className="text-sm"><StarRating score={Math.round(rating.avg)} /> <span className="text-text-muted">({rating.count})</span></span>
          )}
        </div>
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
        {userId ? <RatingForm gameId={game.id} myScore={rating.mine} /> : <SignInPrompt id={game.id} what="rate this game" />}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-accent-cyan">🔀 House variations</h2>
        {variations.length === 0 && <p className="text-text-secondary text-sm">No variations yet. Got house rules?</p>}
        {variations.map((v) => (
          <div key={v.id} className="card p-4">
            <div className="flex justify-between gap-3">
              <h3 className="font-bold">{v.title}</h3>
              {v.author_id === userId && (
                <form action={deleteVariation}>
                  <input type="hidden" name="gameId" value={game.id} />
                  <input type="hidden" name="variationId" value={v.id} />
                  <button className="text-xs text-text-muted hover:text-accent-pink">Delete</button>
                </form>
              )}
            </div>
            <p className="text-sm whitespace-pre-line mt-1">{v.rules}</p>
            <p className="text-text-muted text-xs mt-2">@{v.author?.username ?? 'someone'} · {when(v.created_at)}</p>
          </div>
        ))}
        {userId ? <VariationForm gameId={game.id} /> : <SignInPrompt id={game.id} what="add a variation" />}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-accent-pink">💬 Comments ({comments.length})</h2>
        {comments.map((c) => (
          <div key={c.id} className="card p-4" data-testid="comment">
            <div className="flex justify-between gap-3 text-xs text-text-muted mb-1">
              <span><span className="text-accent-purple">@{c.author?.username ?? 'someone'}</span> · {when(c.created_at)}</span>
              {c.author_id === userId && (
                <form action={deleteComment}>
                  <input type="hidden" name="gameId" value={game.id} />
                  <input type="hidden" name="commentId" value={c.id} />
                  <button className="hover:text-accent-pink" aria-label="Delete comment">Delete</button>
                </form>
              )}
            </div>
            <p className="whitespace-pre-line">{c.body}</p>
          </div>
        ))}
        {userId ? <CommentForm gameId={game.id} /> : <SignInPrompt id={game.id} what="comment" />}
      </section>
    </article>
  )
}
