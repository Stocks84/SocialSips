import { deleteComment } from '@/app/(main)/games/actions'
import ReportButton from '@/components/ui/ReportButton'
import AdminControls from '@/components/admin/AdminControls'
import CommentForm from './CommentForm'
import SignInPrompt from './SignInPrompt'
import HiddenNotice from '@/components/ui/HiddenNotice'
import type { CommentRow } from '@/lib/queries/social'
import { formatDate } from '@/lib/format'

type Props = { kind: 'game' | 'cocktail' | 'meme'; targetId: string; comments: CommentRow[]; userId: string | null; path: string; isAdmin?: boolean; locked?: boolean }

export default function CommentsSection({ kind, targetId, comments, userId, path, isAdmin = false, locked = false }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-accent-pink">💬 Comments ({comments.length})</h2>
      {comments.map((c) => (
        <div key={c.id} className="card p-4" data-testid="comment">
          <div className="flex justify-between gap-3 text-xs text-text-muted mb-1">
            <span><span className="text-accent-purple">@{c.author?.username ?? 'someone'}</span> · {formatDate(c.created_at)}{c.is_hidden && <> <HiddenNotice compact /></>}</span>
            {c.author_id === userId ? (
              <form action={deleteComment}>
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="targetId" value={targetId} />
                <input type="hidden" name="commentId" value={c.id} />
                <button className="hover:text-accent-pink" aria-label="Delete comment">Delete</button>
              </form>
            ) : userId ? (
              <ReportButton targetType="comment" targetId={c.id} />
            ) : null}
          </div>
          <p className="whitespace-pre-line">{c.body}</p>
          {isAdmin && <div className="mt-2"><AdminControls type="comment" id={c.id} compact /></div>}
        </div>
      ))}
      {locked ? <HiddenNotice locked /> : userId ? <CommentForm kind={kind} targetId={targetId} /> : <SignInPrompt path={path} what="comment" />}
    </section>
  )
}
