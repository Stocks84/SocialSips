import { editVariation } from '@/app/(main)/admin/actions'

type Props = { type: 'variation' | 'cocktail_variation'; id: string; title: string; rules: string; redirectTo?: string }

/** Admin-only inline editor for a variation. Render only for admins (server checks again). */
export default function VariationEditForm({ type, id, title, rules, redirectTo }: Props) {
  return (
    <details className="mt-2" data-testid="variation-edit">
      <summary className="cursor-pointer text-xs text-accent-cyan">🛡️ Edit</summary>
      <form action={editVariation} className="space-y-2 mt-2">
        <input type="hidden" name="targetType" value={type} />
        <input type="hidden" name="targetId" value={id} />
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
        <input name="title" defaultValue={title} className="input" required minLength={3} maxLength={80} aria-label="Variation name" />
        <textarea name="rules" defaultValue={rules} rows={6} className="input" required minLength={10} maxLength={3000} aria-label="Variation details" />
        <button className="btn-secondary text-xs py-1 px-3">Save changes</button>
      </form>
    </details>
  )
}
