import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'

export type PersonRow = { id: string; username: string; display_name: string | null; avatar_url: string | null }
export type NotificationRow = {
  id: string; kind: 'follow' | 'reaction' | 'comment' | 'variation' | 'challenge_votes' | 'challenge_win' | 'moderation'
  target_type: string; target_id: string; preview: string | null; count: number; read_at: string | null; updated_at: string
  actor: { username: string } | null
}

/** Unread count for the bell (one indexed count, capped at 99). 0 when signed out. */
export const getUnreadCount = cache(async (): Promise<number> => {
  const { userId } = await getViewer()
  if (!userId) return 0
  const supabase = await createClient()
  if (!supabase) return 0
  const { data, error } = await supabase.rpc('unread_notification_count')
  if (error) { console.error('unread_notification_count', error.message); return 0 }
  return Number(data ?? 0)
})

export async function getFollowCounts(userId: string) {
  const supabase = await createClient()
  if (!supabase) return { followers: 0, following: 0 }
  const { data } = await supabase.rpc('follow_counts', { p_user: userId })
  const r = (data as { followers: number; following: number }[] | null)?.[0]
  return { followers: Number(r?.followers ?? 0), following: Number(r?.following ?? 0) }
}

export async function isFollowing(viewerId: string, userId: string) {
  const supabase = await createClient()
  if (!supabase) return false
  const { data } = await supabase.from('follows').select('followee_id').eq('follower_id', viewerId).eq('followee_id', userId).maybeSingle()
  return Boolean(data)
}

/** Followers (who follow userId) or following (whom userId follows), newest first. */
export async function listPeople(userId: string, which: 'followers' | 'following', limit = 100): Promise<PersonRow[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const q = which === 'followers'
    ? supabase.from('follows').select('created_at, p:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)').eq('followee_id', userId)
    : supabase.from('follows').select('created_at, p:profiles!follows_followee_id_fkey(id, username, display_name, avatar_url)').eq('follower_id', userId)
  const { data, error } = await q.order('created_at', { ascending: false }).limit(limit)
  if (error) console.error('listPeople', error.message)
  return ((data ?? []) as unknown as { p: PersonRow | PersonRow[] | null }[]).map((r) => (Array.isArray(r.p) ? r.p[0] : r.p)).filter((p): p is PersonRow => Boolean(p))
}

export async function listNotifications(limit = 50): Promise<NotificationRow[]> {
  const { userId } = await getViewer()
  if (!userId) return []
  const supabase = await createClient()
  if (!supabase) return []
  const { data, error } = await supabase.from('notifications')
    .select('id, kind, target_type, target_id, preview, count, read_at, updated_at, actor:profiles!notifications_actor_id_fkey(username)')
    .eq('user_id', userId).order('updated_at', { ascending: false }).limit(limit)
  if (error) console.error('notifications', error.message)
  return ((data ?? []) as unknown as (NotificationRow & { actor: NotificationRow['actor'] | NotificationRow['actor'][] })[])
    .map((n) => ({ ...n, actor: Array.isArray(n.actor) ? n.actor[0] ?? null : n.actor }))
}
