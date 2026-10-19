import Image from 'next/image'
import Link from 'next/link'
import Countdown from './Countdown'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { getBoard, getWinner } from '@/lib/queries/challenges'
import { challengeEnd, challengeStatus, KIND_LABEL, weekLabel, type Challenge } from '@/lib/challenge'
import { isOwnStorageUrl } from '@/lib/storage'
import { enterChallenge, voteChallenge, withdrawEntry } from '@/app/(main)/challenge/actions'

/** Own memes / cocktail variations that can still be entered (visible, not already in this challenge). */
async function eligible(c: Challenge, userId: string) {
  const supabase = await createClient()
  if (!supabase) return []
  if (c.kind === 'meme') {
    const { data } = await supabase.from('memes').select('id, caption, joke_text, created_at').eq('author_id', userId).eq('is_hidden', false).order('created_at', { ascending: false }).limit(30)
    return (data ?? []).map((m) => ({ id: m.id, label: m.caption || (m.joke_text ?? '').slice(0, 60) || 'Untitled meme' }))
  }
  const { data } = await supabase.from('cocktail_variations').select('id, title, cocktails(name)').eq('author_id', userId).eq('is_hidden', false).order('created_at', { ascending: false }).limit(30)
  return (data ?? []).map((v) => {
    const ck = (Array.isArray(v.cocktails) ? v.cocktails[0] : v.cocktails) as { name: string } | null
    return { id: v.id, label: `${v.title}${ck ? ` (${ck.name})` : ''}` }
  })
}

export default async function ChallengeView({ c, current, error }: { c: Challenge; current: boolean; error?: string }) {
  const { userId } = await getViewer()
  const status = challengeStatus(c.starts_on)
  const [board, winner] = await Promise.all([getBoard(c.id), status === 'ended' ? getWinner(c.id) : Promise.resolve(null)])
  const mine = userId ? board.find((e) => e.user_id === userId) : undefined
  // my entry may be hidden (excluded from the board): check directly
  let hasEntry = Boolean(mine)
  if (userId && !mine && status === 'open') {
    const supabase = await createClient()
    const { data } = supabase ? await supabase.from('challenge_entries').select('id').eq('challenge_id', c.id).eq('user_id', userId).maybeSingle() : { data: null }
    hasEntry = Boolean(data)
  }
  const options = userId && status === 'open' && !hasEntry ? await eligible(c, userId) : []
  const myVote = board.find((e) => e.my_vote)?.entry_id
  const hidden = (<><input type="hidden" name="challengeId" value={c.id} />{current && <input type="hidden" name="current" value="1" />}</>)
  const createHref = c.kind === 'meme' ? '/memes/new' : '/cocktails'

  return (
    <>
      <section className="card-glass p-6 mb-6" data-testid="challenge-hero">
        <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
          <span className="badge badge-purple">🏆 Weekly challenge</span>
          <span className="badge badge-cyan">{KIND_LABEL[c.kind]}s</span>
          <span className="text-text-muted">{weekLabel(c.starts_on)} (Vienna time)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight gradient-text" data-testid="challenge-theme">{c.theme}</h1>
        {c.description && <p className="text-text-secondary mt-2">{c.description}</p>}
        <p className="mt-4 text-sm">
          {status === 'open' && <Countdown endsAt={challengeEnd(c.starts_on).toISOString()} initialNow={Date.now()} />}
          {status === 'upcoming' && <span>Starts {challengeEndLabel(c.starts_on, true)}</span>}
          {status === 'ended' && <span data-testid="challenge-ended">Voting closed · {board.length} entr{board.length === 1 ? 'y' : 'ies'}</span>}
        </p>
        {status === 'ended' && (winner
          ? <p className="mt-3 font-bold" data-testid="challenge-winner">🏆 Winner: <Link href={`/profile/${winner.username}`} className="text-accent-cyan">@{winner.username}</Link> with {winner.votes} vote{winner.votes === 1 ? '' : 's'}</p>
          : <p className="mt-3 text-text-secondary text-sm">No winner (no votes).</p>)}
      </section>

      {error && <p role="alert" className="card p-4 mb-6 text-sm text-red-400" data-testid="challenge-error">{error}</p>}

      {status === 'open' && (
        <section className="card p-5 mb-6" data-testid="challenge-enter">
          {!userId ? (
            <p className="text-sm"><Link href="/sign-in?redirectTo=/challenge" className="text-accent-purple">Sign in</Link> to enter and vote.</p>
          ) : hasEntry ? (
            <form action={withdrawEntry} className="flex flex-wrap items-center gap-3 text-sm">{hidden}
              <span>✅ You&apos;re in! {mine ? `${mine.votes} vote${mine.votes === 1 ? '' : 's'} so far.` : '(Your entry is hidden by a moderator.)'}</span>
              <button className="btn-ghost text-sm" data-testid="withdraw-entry">Withdraw entry</button>
            </form>
          ) : options.length ? (
            <form action={enterChallenge} className="flex flex-wrap items-end gap-3">{hidden}
              <label className="text-sm flex-1 min-w-[220px]">Enter one of your {c.kind === 'meme' ? 'memes' : 'cocktail variations'}
                <select name="submissionId" className="input mt-1" required data-testid="entry-select">{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
              </label>
              <button className="btn-primary" data-testid="enter-challenge">Enter challenge</button>
              <p className="w-full text-xs text-text-muted">One entry per person. Or <Link href={createHref} className="text-accent-purple">make a new one</Link>.</p>
            </form>
          ) : (
            <p className="text-sm">{c.kind === 'meme' ? <>Post a <Link href="/memes/new" className="text-accent-purple">new meme</Link></> : <>Add a variation to any <Link href="/cocktails" className="text-accent-purple">cocktail</Link></>}, then come back to enter it.</p>
          )}
        </section>
      )}

      <h2 id="entries" className="text-xl font-bold mb-3">Entries {board.length > 0 && <span className="text-text-muted text-sm font-normal">({board.length})</span>}</h2>
      {board.length === 0 ? <p className="text-text-secondary text-sm" data-testid="no-entries">No entries yet. Be the first!</p> : (
        <ul className="grid gap-4 sm:grid-cols-2" data-testid="challenge-entries">
          {board.map((e, i) => {
            const isWinner = winner?.entry_id === e.entry_id
            const href = e.meme_id ? `/memes/${e.meme_id}` : `/cocktails/${e.cocktail_id}`
            return (
              <li key={e.entry_id} className={`card p-4 flex flex-col gap-3 ${isWinner ? 'ring-2 ring-accent-purple' : ''}`} data-testid="challenge-entry">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-text-muted">#{i + 1} · <Link href={`/profile/${e.username}`} className="hover:text-accent-cyan">@{e.username}</Link></span>
                  {isWinner && <span className="badge badge-purple" data-testid="winner-badge">🏆 Winner</span>}
                </div>
                <Link href={href} className="block">
                  {e.meme_id && isOwnStorageUrl(e.meme_image_url) && <Image src={e.meme_image_url!} alt={e.meme_caption ?? 'Meme'} width={600} height={400} className="w-full h-44 object-cover rounded-lg mb-2" sizes="(min-width: 640px) 50vw, 100vw" />}
                  <p className="font-semibold">{e.meme_id ? (e.meme_caption ?? 'Meme') : e.variation_title}</p>
                  {e.meme_joke && <p className="text-sm text-text-secondary line-clamp-3">{e.meme_joke}</p>}
                  {e.variation_rules && <p className="text-sm text-text-secondary line-clamp-3">{e.variation_rules}</p>}
                  {e.cocktail_name && <p className="text-xs text-text-muted mt-1">🍸 Twist on {e.cocktail_name}</p>}
                </Link>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="font-bold" data-testid="entry-votes">{e.votes} vote{e.votes === 1 ? '' : 's'}</span>
                  {status === 'open' && userId && e.can_vote && (
                    <form action={voteChallenge}>{hidden}
                      <input type="hidden" name="entryId" value={e.my_vote ? '' : e.entry_id} />
                      <button className={e.my_vote ? 'btn-primary text-sm py-1.5 px-3' : 'btn-secondary text-sm py-1.5 px-3'} data-testid={e.my_vote ? 'unvote' : 'vote'} aria-pressed={e.my_vote}>
                        {e.my_vote ? '✅ Your vote' : myVote ? 'Switch vote' : '👍 Vote'}
                      </button>
                    </form>
                  )}
                  {status === 'open' && userId === e.user_id && <span className="text-xs text-text-muted">Your entry</span>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

function challengeEndLabel(startsOn: string, start = false) {
  const d = start ? new Date(new Date(startsOn + 'T12:00:00Z')) : new Date()
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' 00:00 (Vienna)'
}
