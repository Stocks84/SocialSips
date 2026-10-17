import { deleteItem, hideItem } from '@/app/(main)/admin/actions'
import type { TargetType } from '@/lib/server/moderation'

type Props = { type: TargetType; id: string; redirectTo?: string; compact?: boolean }

/** Admin-only Hide / Delete buttons. Render only when the viewer is an admin (server checks again). */
export default function AdminControls({ type, id, redirectTo, compact }: Props) {
  const fields = (
    <>
      <input type="hidden" name="targetType" value={type} />
      <input type="hidden" name="targetId" value={id} />
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
    </>
  )
  const cls = compact ? 'text-xs' : 'text-xs py-1 px-3'
  return (
    <span className="inline-flex items-center gap-2" data-testid="admin-controls">
      <span className="text-[10px] uppercase tracking-wide text-accent-cyan">🛡️</span>
      <form action={hideItem}>{fields}<button className={`btn-ghost ${cls}`}>Hide</button></form>
      <form action={deleteItem}>{fields}<button className={`btn-danger ${cls}`}>Delete</button></form>
    </span>
  )
}
