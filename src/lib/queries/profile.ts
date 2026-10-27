import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { visibleTo } from './visibility'
import type { Notice } from '@/components/moderation/StatementOfReasons'

export type ProfilePost = { id: string; title: string; is_hidden: boolean; created_at: string; href: string; emoji: string }

export type ProfileRow = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
}

/** The profile row, fetched once per request. Null when the username doesn't exist. */
export const getProfileByUsername = cache(async (username: string): Promise<ProfileRow | null> => {
  const supabase = await createClient()
  if (!supabase) return null
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url')
    .eq('username', username)
    .maybeSingle()
  return data
})

/** Games + cocktails a user shared. The owner also sees their hidden ones (badged); RLS hides them from everyone else. */
export async function getProfilePosts(profileId: string): Promise<{ posts: ProfilePost[]; isOwner: boolean } | null> {
  const supabase = await createClient()
  if (!supabase) return null
  const { userId } = await getViewer()
  const filter = visibleTo(userId)
  const [{ data: games }, { data: cocktails }] = await Promise.all([
    supabase.from('games').select('id, title, is_hidden, created_at').eq('author_id', profileId).or(filter).order('created_at', { ascending: false }).limit(50),
    supabase.from('cocktails').select('id, name, is_hidden, created_at').eq('author_id', profileId).or(filter).order('created_at', { ascending: false }).limit(50),
  ])
  const posts: ProfilePost[] = [
    ...(games ?? []).map((g) => ({ ...g, href: `/games/${g.id}`, emoji: '🎲' })),
    ...(cocktails ?? []).map((c) => ({ id: c.id, title: c.name, is_hidden: c.is_hidden, created_at: c.created_at, href: `/cocktails/${c.id}`, emoji: '🍸' })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return { posts, isOwner: userId === profileId }
}

/** Reactions received on the user's visible memes, by emoji. */
export async function getProfileReactionTotals(profileId: string): Promise<Record<string, number> | null> {
  const supabase = await createClient()
  if (!supabase) return null
  const { data, error } = await supabase.rpc('profile_reaction_totals', { p_user: profileId })
  if (error) {
    console.error('profile_reaction_totals', error.message)
    return null
  }
  return Object.fromEntries(((data ?? []) as { emoji: string; n: number }[]).map((r) => [r.emoji, Number(r.n)]))
}

/** Whether the viewer currently blocks this profile. */
export async function isBlocking(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = await createClient()
  if (!supabase) return false
  const { data } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .maybeSingle()
  return Boolean(data)
}

/** Moderation notices for the profile owner (only they should call this). */
export async function listModerationNotices(authorId: string): Promise<Notice[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('moderation_notices')
    .select('id, target_type, target_id, reason, explanation, preview, created_at, reversed_at')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data ?? []) as Notice[]
}
