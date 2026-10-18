/** Shown to an author on their own post after a moderator hid it. Nobody else can see the post. */
export default function HiddenNotice({ compact = false, locked = false }: { compact?: boolean; locked?: boolean }) {
  if (locked) return <p className="card-glass p-4 text-sm text-text-secondary" data-testid="forms-locked">🙈 Comments and ratings are off while this is hidden.</p>
  if (compact) return <span className="badge badge-pink" data-testid="hidden-badge">🙈 Hidden</span>
  return (
    <div className="card-glass p-4 my-3 text-sm flex items-start gap-3" data-testid="hidden-notice">
      <span className="badge badge-pink shrink-0" data-testid="hidden-badge">🙈 Hidden</span>
      <p className="text-text-secondary">
        A moderator has hidden this post, so only you can see it. It won&apos;t show in the feed, search or to anyone else, and new comments and ratings are switched off.
      </p>
    </div>
  )
}
