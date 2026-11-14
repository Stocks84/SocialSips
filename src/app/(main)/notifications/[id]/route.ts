import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notificationHref } from '@/lib/notifications'
import type { NotificationRow } from '@/lib/queries/follows'
import { safePath } from '@/lib/safe-path'
import { isSameOrigin } from '@/lib/same-origin'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET never changes anything (link prefetchers, crawlers, <img src> CSRF). Old links land on the list.
 * Opening a notification is a same-origin form POST to this route (see the notifications page).
 */
export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/notifications', req.url), 303)
}

/** Marks the notification read, then goes to what it's about. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req.headers)) return new NextResponse('Forbidden', { status: 403 })
  const { id } = await params
  const home = new URL('/notifications', req.url)
  const supabase = await createClient()
  if (!supabase || !UUID.test(id)) return NextResponse.redirect(home, 303)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/sign-in?redirectTo=/notifications', req.url), 303)
  const { data } = await supabase.from('notifications')
    .select('id, kind, target_type, target_id, preview, count, read_at, updated_at, actor:profiles!notifications_actor_id_fkey(username)').eq('id', id).maybeSingle()
  if (!data) return NextResponse.redirect(home, 303)
  // RLS limits both the select and the RPC to the signed-in user's own notifications.
  await supabase.rpc('mark_notifications_read', { p_ids: [id] })
  const n = { ...data, actor: Array.isArray(data.actor) ? data.actor[0] ?? null : data.actor } as unknown as NotificationRow
  const me = (user.user_metadata?.username as string | undefined) ?? ''
  return NextResponse.redirect(new URL(safePath(notificationHref(n, me), '/notifications'), req.url), 303)
}
