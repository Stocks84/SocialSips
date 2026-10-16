import { notFound } from 'next/navigation'
import StarRating from '@/components/ui/StarRating'
import CommentsSection from '@/components/social/CommentsSection'
import RatingForm from '@/components/social/RatingForm'
import SignInPrompt from '@/components/social/SignInPrompt'
import { getCocktailDetail } from '@/lib/queries/cocktails'

export default async function CocktailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getCocktailDetail(id)
  if (!detail) notFound()
  const { cocktail: c, comments, rating, userId } = detail
  const path = `/cocktails/${c.id}`
  return (
    <article className="max-w-3xl space-y-10">
      <header>
        <h1 className="text-4xl font-black gradient-text mb-3">{c.name}</h1>
        <div className="flex flex-wrap items-center gap-3">
          {c.is_alcohol_free && <span className="badge badge-cyan">Alcohol-free</span>}
          {rating.avg !== null && (
            <span className="text-sm"><StarRating score={Math.round(rating.avg)} /> <span className="text-text-muted">({rating.count})</span></span>
          )}
        </div>
        <p className="text-text-secondary mt-4">{c.description}</p>
      </header>
      {c.ingredients && c.ingredients.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-3 text-accent-cyan">🧪 Ingredients</h2>
          <ul className="card p-5 space-y-1">
            {c.ingredients.map((i) => <li key={i.item}><span className="text-accent-cyan">{i.amount}</span> {i.item}</li>)}
          </ul>
        </section>
      )}
      {c.method && (
        <section>
          <h2 className="text-xl font-bold mb-3 text-accent-purple">🍸 Method</h2>
          <p className="card p-5 whitespace-pre-line">{c.method}</p>
        </section>
      )}
      <section>
        <h2 className="text-xl font-bold mb-3 text-accent-cyan">⭐ Rate it</h2>
        {userId ? <RatingForm kind="cocktail" targetId={c.id} myScore={rating.mine} /> : <SignInPrompt path={path} what="rate this cocktail" />}
      </section>
      <CommentsSection kind="cocktail" targetId={c.id} comments={comments} userId={userId} path={path} />
    </article>
  )
}
