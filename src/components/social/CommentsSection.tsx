import { deleteComment, updateOwnComment } from '@/lib/actions/social'
import InlineEdit, { EditedMark } from './InlineEdit'
import ReportButton from '@/components/ui/ReportButton'
import PublicReportLink from '@/components/ui/PublicReportLink'
import AdminControls from '@/components/admin/AdminControls'
import CommentForm from './CommentForm'
import SignInPrompt from './SignInPrompt'
import HiddenNotice from '@/components/ui/HiddenNotice'
import type { CommentRow } from '@/lib/queries/social'
import { formatDate } from '@/lib/format'
import ConfirmSubmit from '@/components/ui/ConfirmSubmit'

type Props = { kind: 'game' | 'cocktail' | 'meme'; targetId: string; comments: CommentRow[]; userId: string | null; path: string; isAdmin?: boolean; locked?: boolean }

export default function CommentsSection({ kind, targetId, comments, userId, path, isAdmin = false, locked = false }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-accent">Comments ({comments.length})</h2>
      {comments.map((c) => (
        <div key={c.id} className="card p-4" data-testid="comment">
          <div className="flex justify-between gap-3 text-xs text-ink-3 mb-1">
            <span><span className="text-accent">@{c.author?.username ?? 'someone'}</span> · {formatDate(c.created_at)}<EditedMark at={c.edited_at} />{c.is_hidden && <> <HiddenNotice compact /></>}</span>
            {c.author_id === userId ? (
              <form action={deleteComment}>
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="targetId" value={targetId} />
                <input type="hidden" name="commentId" value={c.id} />
                <ConfirmSubmit message="Delete this comment? There's no undo." className="hover:text-ink" label="Delete comment">Delete</ConfirmSubmit>
              </form>
            ) : userId ? (
              <ReportButton targetType="comment" targetId={c.id} />
            ) : !userId ? <PublicReportLink targetType="comment" targetId={c.id} /> : null}
          </div>
          {c.author_id === userId && !c.is_hidden && !locked ? (
            <InlineEdit action={updateOwnComment} testId="comment" hidden={{ kind, targetId, commentId: c.id }}
              fields={[{ name: 'body', label: 'Edit comment', value: c.body, max: 1000, rows: 3 }]}>
              <p className="whitespace-pre-line" data-testid="comment-body">{c.body}</p>
            </InlineEdit>
          ) : (
            <p className="whitespace-pre-line" data-testid="comment-body">{c.body}</p>
          )}
          {isAdmin && <div className="mt-2"><AdminControls type="comment" id={c.id} compact /></div>}
        </div>
      ))}
      {locked ? <HiddenNotice locked /> : userId ? <CommentForm kind={kind} targetId={targetId} /> : <SignInPrompt path={path} what="comment" />}
    </section>
  )
}
