import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notificationHref } from '@/lib/notifications'
import type { NotificationRow } from '@/lib/queries/follows'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Opening a notification marks it read, then goes to what it's about. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const home = new URL('/notifications', req.url)
  const supabase = await createClient()
  if (!supabase || !UUID.test(id)) return NextResponse.redirect(home)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/sign-in?redirectTo=/notifications', req.url))
  const { data } = await supabase.from('notifications')
    .select('id, kind, target_type, target_id, preview, count, read_at, updated_at, actor:profiles!notifications_actor_id_fkey(username)').eq('id', id).maybeSingle()
  if (!data) return NextResponse.redirect(home)
  await supabase.rpc('mark_notifications_read', { p_ids: [id] })
  const n = { ...data, actor: Array.isArray(data.actor) ? data.actor[0] ?? null : data.actor } as unknown as NotificationRow
  const me = (user.user_metadata?.username as string | undefined) ?? ''
  return NextResponse.redirect(new URL(notificationHref(n, me), req.url), 303)
}
