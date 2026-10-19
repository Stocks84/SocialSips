'use server'
import { revalidatePath } from 'next/cache'
import { requireUser, UUID } from '@/lib/server/auth'

export async function markAllRead() {
  const auth = await requireUser()
  if ('error' in auth) return
  await auth.supabase.rpc('mark_notifications_read', { p_ids: null })
  revalidatePath('/', 'layout')
}

export async function markRead(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return
  const id = String(formData.get('id') ?? '')
  if (!UUID.test(id)) return
  await auth.supabase.rpc('mark_notifications_read', { p_ids: [id] })
  revalidatePath('/', 'layout')
}
