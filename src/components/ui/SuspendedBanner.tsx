import Link from 'next/link'

/** Shown on every signed-in page to a suspended member. The database refuses their writes as well (migration 0040). */
export default function SuspendedBanner({ reason }: { reason: string | null }) {
  return (
    <div role="status" className="card mb-6 border-danger p-4 text-sm" data-testid="suspended-banner">
      <p className="font-semibold text-danger">Your account is suspended</p>
      <p className="mt-1 text-ink-2">
        You can still browse and delete your own posts, but you can’t post, comment, rate, react, follow, report or upload until a moderator lifts it.
        {' '}To appeal, see <Link href="/terms" className="text-accent underline">the Terms</Link>.
      </p>
      {reason && <p className="mt-2 text-ink-2">Reason given: <span className="text-ink">{reason}</span></p>}
    </div>
  )
}
