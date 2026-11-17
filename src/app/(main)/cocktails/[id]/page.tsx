import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { PREVIEW_HEADER } from '@/lib/preview'
import { getSharedCocktail } from '@/lib/queries/share'
import { siteOrigin } from '@/lib/server/share'
import { buildShareMetadata, NOT_FOUND_META, snippet } from '@/lib/share-meta'
import StarRating from '@/components/ui/StarRating'
import CommentsSection from '@/components/social/CommentsSection'
import RatingForm from '@/components/social/RatingForm'
import SignInPrompt from '@/components/social/SignInPrompt'
import VariationsSection from '@/components/social/VariationsSection'
import ReportButton from '@/components/ui/ReportButton'
import { reportControl } from '@/lib/suspension'
import PublicReportLink from '@/components/ui/PublicReportLink'
import Image from 'next/image'
import { isOwnStorageUrl } from '@/lib/storage'
import Link from 'next/link'
import { getCocktailDetail } from '@/lib/queries/cocktails'
import { getViewer } from '@/lib/server/viewer'
import SuspendedFormBlock from '@/components/ui/SuspendedFormBlock'
import HiddenNotice from '@/components/ui/HiddenNotice'
import StatementOfReasons from '@/components/moderation/StatementOfReasons'
import SavedBanner from '@/components/ui/SavedBanner'
import AdminControls from '@/components/admin/AdminControls'

/** Share preview (Open Graph / Twitter). Anonymous view only: hidden or missing cocktails get generic metadata. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const c = await getSharedCocktail(id)
  if (!c) return NOT_FOUND_META
  const origin = siteOrigin()
  const image = isOwnStorageUrl(c.image_url) ? c.image_url : `${origin}/cocktails/${c.id}/og`
  return buildShareMetadata({ origin, path: `/cocktails/${c.id}`, title: snippet(c.name, 70), description: snippet(c.description, 160) || 'A drink recipe on Social Sips. 18+ only.', image })
}

export default async function CocktailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params
  const { saved } = await searchParams
  if ((await headers()).get(PREVIEW_HEADER) === '1') {
    // Link-preview bot (no age cookie): the share tags come from generateMetadata; the body stays a stub.
    const c = await getSharedCocktail(id)
    if (!c) notFound()
    return (
      <article className="max-w-3xl space-y-4" data-testid="preview-stub">
        <p className="font-semibold text-lg">{c.name}</p>
        <Link href={`/cocktails/${c.id}`} className="btn-primary text-sm">Open on Social Sips (18+)</Link>
      </article>
    )
  }
  const detail = await getCocktailDetail(id)
  if (!detail) notFound()
  const { cocktail: c, comments, variations, rating, userId } = detail
  const { isAdmin, suspended } = await getViewer()
  const path = `/cocktails/${c.id}`
  const report = reportControl({ signedIn: Boolean(userId), suspended: Boolean(suspended) })
  return (
    <article className="max-w-3xl space-y-10">
      <header>
        <SavedBanner show={saved === '1'} />
        {c.is_hidden && <><HiddenNotice />{userId && c.author_id === userId && <StatementOfReasons type="cocktail" id={c.id} />}</>}
        {!c.is_hidden && isOwnStorageUrl(c.image_url) && (
          <Image src={c.image_url} alt="" width={1200} height={630} className="rounded-sm mb-6 w-full h-64 object-cover border border-rule" />
        )}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-display font-normal text-ink mb-3">{c.name}</h1>
          {userId && c.author_id === userId && !c.is_hidden ? (
            <Link href={`${path}/edit`} className="btn-secondary text-sm py-2 px-4 shrink-0">Edit</Link>
          ) : userId && c.author_id !== userId && report === 'button' ? (
            <ReportButton targetType="cocktail" targetId={c.id} />
          ) : report === 'public' ? <PublicReportLink targetType="cocktail" targetId={c.id} /> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {c.is_alcohol_free && <span className="chip">Alcohol-free</span>}
          {rating.avg !== null && (
            <span className="text-sm"><StarRating score={Math.round(rating.avg)} /> <span className="text-ink-3">({rating.count})</span></span>
          )}
        </div>
        {isAdmin && <div className="mt-3"><AdminControls type="cocktail" id={c.id} redirectTo="/cocktails" /></div>}
        <p className="text-ink-2 mt-4">{c.description}</p>
        {c.author && <p className="text-ink-3 text-xs mt-2">by <Link href={`/profile/${c.author.username}`} className="text-accent">@{c.author.username}</Link></p>}
      </header>
      {c.ingredients && c.ingredients.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-3 text-accent">Ingredients</h2>
          <ul className="card p-5 space-y-1">
            {c.ingredients.map((i) => <li key={i.item}><span className="text-accent">{i.amount}</span> {i.item}</li>)}
          </ul>
        </section>
      )}
      {c.method && (
        <section>
          <h2 className="text-xl font-bold mb-3 text-accent">Method</h2>
          <p className="card p-5 whitespace-pre-line">{c.method}</p>
        </section>
      )}
      <section>
        <h2 className="text-xl font-bold mb-3 text-accent">Rate it</h2>
        {c.is_hidden ? <HiddenNotice locked /> : userId ? (suspended ? <SuspendedFormBlock compact action="rate" reason={suspended.reason} /> : <RatingForm kind="cocktail" targetId={c.id} myScore={rating.mine} />) : <SignInPrompt path={path} what="rate this cocktail" />}
      </section>
      <VariationsSection kind="cocktail" targetId={c.id} variations={variations} userId={userId} path={path} isAdmin={isAdmin} locked={Boolean(c.is_hidden)} suspended={suspended} />
      <CommentsSection kind="cocktail" targetId={c.id} comments={comments} userId={userId} path={path} isAdmin={isAdmin} locked={Boolean(c.is_hidden)} suspended={suspended} />
    </article>
  )
}
