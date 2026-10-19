import { notFound } from 'next/navigation'
import StarRating from '@/components/ui/StarRating'
import CommentsSection from '@/components/social/CommentsSection'
import RatingForm from '@/components/social/RatingForm'
import SignInPrompt from '@/components/social/SignInPrompt'
import VariationsSection from '@/components/social/VariationsSection'
import ReportButton from '@/components/ui/ReportButton'
import Image from 'next/image'
import { isOwnStorageUrl } from '@/lib/storage'
import Link from 'next/link'
import { getCocktailDetail } from '@/lib/queries/cocktails'
import { getViewer } from '@/lib/server/viewer'
import HiddenNotice from '@/components/ui/HiddenNotice'
import SavedBanner from '@/components/ui/SavedBanner'
import AdminControls from '@/components/admin/AdminControls'

export default async function CocktailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params
  const { saved } = await searchParams
  const detail = await getCocktailDetail(id)
  if (!detail) notFound()
  const { cocktail: c, comments, variations, rating, userId } = detail
  const { isAdmin } = await getViewer()
  const path = `/cocktails/${c.id}`
  return (
    <article className="max-w-3xl space-y-10">
      <header>
        <SavedBanner show={saved === '1'} />
        {c.is_hidden && <HiddenNotice />}
        {isOwnStorageUrl(c.image_url) && (
          <Image src={c.image_url} alt="" width={1200} height={630} className="rounded-2xl mb-6 w-full h-64 object-cover border border-border" />
        )}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-black gradient-text mb-3">{c.name}</h1>
          {userId && c.author_id === userId && !c.is_hidden ? (
            <Link href={`${path}/edit`} className="btn-secondary text-sm py-2 px-4 shrink-0">✏️ Edit</Link>
          ) : userId && c.author_id !== userId ? (
            <ReportButton targetType="cocktail" targetId={c.id} />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {c.is_alcohol_free && <span className="badge badge-cyan">Alcohol-free</span>}
          {rating.avg !== null && (
            <span className="text-sm"><StarRating score={Math.round(rating.avg)} /> <span className="text-text-muted">({rating.count})</span></span>
          )}
        </div>
        {isAdmin && <div className="mt-3"><AdminControls type="cocktail" id={c.id} redirectTo="/cocktails" /></div>}
        <p className="text-text-secondary mt-4">{c.description}</p>
        {c.author && <p className="text-text-muted text-xs mt-2">by <Link href={`/profile/${c.author.username}`} className="text-accent-purple">@{c.author.username}</Link></p>}
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
        {c.is_hidden ? <HiddenNotice locked /> : userId ? <RatingForm kind="cocktail" targetId={c.id} myScore={rating.mine} /> : <SignInPrompt path={path} what="rate this cocktail" />}
      </section>
      <VariationsSection kind="cocktail" targetId={c.id} variations={variations} userId={userId} path={path} isAdmin={isAdmin} locked={Boolean(c.is_hidden)} />
      <CommentsSection kind="cocktail" targetId={c.id} comments={comments} userId={userId} path={path} isAdmin={isAdmin} locked={Boolean(c.is_hidden)} />
    </article>
  )
}
