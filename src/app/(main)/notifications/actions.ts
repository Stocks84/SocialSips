'use server'
import { revalidatePath } from 'next/cache'
import { requireUser, UUID } from '@/lib/server/auth'
import { friendlyError } from '@/lib/server/errors'
import { failBack } from '@/lib/server/action-error'

export async function markAllRead() {
  const auth = await requireUser()
  if ('error' in auth) return failBack(auth.error, '/notifications')
  const { error } = await auth.supabase.rpc('mark_notifications_read', { p_ids: null })
  if (error) return failBack(friendlyError(error, 'markAllRead'), '/notifications')
  revalidatePath('/', 'layout')
}

export async function markRead(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return failBack(auth.error, '/notifications')
  const id = String(formData.get('id') ?? '')
  if (!UUID.test(id)) return failBack('Unknown notification.', '/notifications')
  const { error } = await auth.supabase.rpc('mark_notifications_read', { p_ids: [id] })
  if (error) return failBack(friendlyError(error, 'markRead'), '/notifications')
  revalidatePath('/', 'layout')
}
