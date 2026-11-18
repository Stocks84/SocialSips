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
import SuspendedFormBlock from '@/components/ui/SuspendedFormBlock'
import { reportControl } from '@/lib/suspension'
import CopyCommentLink from './CopyCommentLink'
import { commentAnchorId } from '@/lib/report-url'

type Props = { kind: 'game' | 'cocktail' | 'meme'; targetId: string; comments: CommentRow[]; userId: string | null; path: string; isAdmin?: boolean; locked?: boolean; suspended?: { reason: string | null } | null }

export default function CommentsSection({ kind, targetId, comments, userId, path, isAdmin = false, locked = false, suspended = null }: Props) {
  const report = reportControl({ signedIn: Boolean(userId), suspended: Boolean(suspended) })
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-accent">Comments ({comments.length})</h2>
      {comments.map((c) => (
        <div key={c.id} id={commentAnchorId(c.id)} className="card p-4 scroll-mt-24 target:ring-2 target:ring-accent" data-testid="comment">
          <div className="flex justify-between gap-3 text-xs text-ink-3 mb-1">
            <span><span className="text-accent">@{c.author?.username ?? 'someone'}</span> · {formatDate(c.created_at)}<EditedMark at={c.edited_at} />{c.is_hidden && <> <HiddenNotice compact /></>}</span>
            <div className="flex items-center gap-3 shrink-0">
              <CopyCommentLink path={path} commentId={c.id} />
              {c.author_id === userId ? (
                <form action={deleteComment}>
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="targetId" value={targetId} />
                  <input type="hidden" name="commentId" value={c.id} />
                  <ConfirmSubmit message="Delete this comment? There's no undo." className="hover:text-ink" label="Delete comment">Delete</ConfirmSubmit>
                </form>
              ) : report === 'button' ? (
                <ReportButton targetType="comment" targetId={c.id} />
              ) : report === 'public' ? <PublicReportLink targetType="comment" targetId={c.id} /> : null}
            </div>
          </div>
          {c.author_id === userId && !c.is_hidden && !locked && !suspended ? (
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
      {locked ? <HiddenNotice locked /> : userId ? (suspended ? <SuspendedFormBlock compact action="comment" reason={suspended.reason} /> : <CommentForm kind={kind} targetId={targetId} />) : <SignInPrompt path={path} what="comment" />}
    </section>
  )
}
