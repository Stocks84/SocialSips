import { deleteVariation, updateOwnVariation } from '@/app/(main)/games/actions'
import InlineEdit, { EditedMark } from './InlineEdit'
import ReportButton from '@/components/ui/ReportButton'
import AdminControls from '@/components/admin/AdminControls'
import VariationEditForm from '@/components/admin/VariationEditForm'
import VariationForm from './VariationForm'
import SignInPrompt from './SignInPrompt'
import HiddenNotice from '@/components/ui/HiddenNotice'
import type { VariationRow } from '@/lib/queries/social'
import { formatDate } from '@/lib/format'

type Props = { kind: 'game' | 'cocktail'; targetId: string; variations: VariationRow[]; userId: string | null; path: string; isAdmin?: boolean; locked?: boolean }

export default function VariationsSection({ kind, targetId, variations, userId, path, isAdmin = false, locked = false }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-accent-cyan">🔀 {kind === 'game' ? 'House variations' : 'Twists & variations'}</h2>
      {variations.length === 0 && <p className="text-text-secondary text-sm">No variations yet. Got your own spin?</p>}
      {variations.map((v) => (
        <div key={v.id} className="card p-4" data-testid="variation">
          <div className="flex justify-between gap-3">
            <h3 className="font-bold">{v.title}{v.is_hidden && <> <HiddenNotice compact /></>}</h3>
            {v.author_id === userId ? (
              <form action={deleteVariation}>
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="targetId" value={targetId} />
                <input type="hidden" name="variationId" value={v.id} />
                <button className="text-xs text-text-muted hover:text-accent-pink">Delete</button>
              </form>
            ) : userId ? (
              <ReportButton targetType={kind === 'game' ? 'variation' : 'cocktail_variation'} targetId={v.id} />
            ) : null}
          </div>
          {v.author_id === userId && !v.is_hidden && !locked ? (
            <InlineEdit action={updateOwnVariation} testId="variation" hidden={{ kind, targetId, variationId: v.id }}
              fields={[{ name: 'title', label: 'Variation name', value: v.title, max: 80 }, { name: 'rules', label: 'Variation details', value: v.rules, max: 3000, rows: 4 }]}>
              <p className="text-sm whitespace-pre-line mt-1" data-testid="variation-rules">{v.rules}</p>
            </InlineEdit>
          ) : (
            <p className="text-sm whitespace-pre-line mt-1" data-testid="variation-rules">{v.rules}</p>
          )}
          <p className="text-text-muted text-xs mt-2">@{v.author?.username ?? 'someone'} · {formatDate(v.created_at)}<EditedMark at={v.edited_at} /></p>
          {isAdmin && (
            <div className="mt-2">
              <AdminControls type={kind === 'game' ? 'variation' : 'cocktail_variation'} id={v.id} compact />
              <VariationEditForm type={kind === 'game' ? 'variation' : 'cocktail_variation'} id={v.id} title={v.title} rules={v.rules} />
            </div>
          )}
        </div>
      ))}
      {locked ? <HiddenNotice locked /> : userId ? <VariationForm kind={kind} targetId={targetId} /> : <SignInPrompt path={path} what="add a variation" />}
    </section>
  )
}
