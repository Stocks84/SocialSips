'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin, UUID } from '@/lib/server/auth'
import { friendlyError } from '@/lib/server/errors'

const MSG: Record<string, string> = {
  admins_only: 'Admins only.',
  cannot_suspend_self: 'You can’t suspend your own account.',
  cannot_suspend_admin: 'Admin accounts can’t be suspended. Remove the admin flag first if you really mean it.',
  user_not_found: 'That account no longer exists.',
}

function back(q: string, params: Record<string, string>): never {
  const u = new URLSearchParams(params)
  if (q) u.set('q', q.slice(0, 40))
  redirect(`/admin/users?${u.toString()}`)
}

/** Admin-only: suspend or lift the suspension on one account. Re-checked in the database (admin + guards). */
export async function setSuspension(formData: FormData) {
  const q = String(formData.get('q') ?? '')
  const auth = await requireAdmin()
  if ('error' in auth) return back(q, { error: auth.error ?? 'Admins only.' })
  const userId = String(formData.get('userId') ?? '')
  if (!UUID.test(userId)) return back(q, { error: 'Unknown account.' })
  const suspend = formData.get('suspend') === '1'
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 500)
  const { error } = await auth.supabase.rpc('set_account_suspension', {
    p_user: userId, p_suspended: suspend, ...(suspend && reason ? { p_reason: reason } : {}),
  })
  if (error) return back(q, { error: MSG[error.message] ?? friendlyError(error, 'setSuspension') })
  revalidatePath('/', 'layout')
  return back(q, { saved: suspend ? 'suspended' : 'lifted' })
}
