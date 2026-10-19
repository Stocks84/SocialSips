import { deleteItem, hideItem } from '@/app/(main)/admin/actions'
import type { TargetType } from '@/lib/server/moderation'
import ModReasonFields from './ModReasonFields'

type Props = { type: TargetType; id: string; redirectTo?: string; compact?: boolean }

/** Admin-only Hide / Delete with a reason for the author. Render only for admins (the server checks again). */
export default function AdminControls({ type, id, redirectTo }: Props) {
  return (
    <details className="inline-block text-xs relative" data-testid="admin-controls">
      <summary className="cursor-pointer list-none text-accent-cyan">🛡️ Moderate</summary>
      <form className="card p-3 mt-2 space-y-2 absolute left-0 z-30 w-72 shadow-card-lg">
        <input type="hidden" name="targetType" value={type} />
        <input type="hidden" name="targetId" value={id} />
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
        <ModReasonFields />
        <div className="flex gap-2">
          <button formAction={hideItem} className="btn-secondary text-xs py-1 px-3" data-testid="mod-hide">Hide</button>
          <button formAction={deleteItem} className="btn-danger text-xs py-1 px-3" data-testid="mod-delete">Delete</button>
        </div>
      </form>
    </details>
  )
}
