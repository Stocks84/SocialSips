import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type ProfileEditRow = {
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
}

export type MyReportRow = {
  id: string
  target_type: string
  target_url: string | null
  reason: string
  status: string
  outcome: string | null
  created_at: string
  decided_at: string | null
}

export type MyBlockRow = {
  blocked_id: string
  created_at: string
  blocked: { username: string } | null
}

/** Signed-in user's profile fields for the edit form. */
export async function getOwnProfileEdit(userId: string): Promise<ProfileEditRow | null> {
  const supabase = await createClient()
  if (!supabase) return null
  const { data } = await supabase
    .from('profiles')
    .select('username, display_name, bio, avatar_url')
    .eq('id', userId)
    .maybeSingle()
  return data
}

/** Account page: username, own reports, and blocks. */
export async function getAccountPageData(userId: string): Promise<{
  username: string
  reports: MyReportRow[]
  blocks: MyBlockRow[]
} | null> {
  const supabase = await createClient()
  if (!supabase) return null
  const [{ data: me }, { data: reports }, { data: blocks }] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', userId).maybeSingle(),
    supabase
      .from('reports')
      .select('id, target_type, target_url, reason, status, outcome, created_at, decided_at')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('blocks')
      .select('blocked_id, created_at, blocked:profiles!blocks_blocked_id_fkey(username)')
      .eq('blocker_id', userId)
      .order('created_at', { ascending: false }),
  ])
  if (!me) return null
  const blockRows: MyBlockRow[] = (blocks ?? []).map((b) => {
    const blocked = (Array.isArray(b.blocked) ? b.blocked[0] : b.blocked) as { username: string } | null
    return { blocked_id: b.blocked_id, created_at: b.created_at, blocked }
  })
  return {
    username: me.username,
    reports: (reports ?? []) as MyReportRow[],
    blocks: blockRows,
  }
}
