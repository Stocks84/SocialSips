import { createClient } from '@/lib/supabase/server'
import { parentVisibleTo, visibleTo } from './visibility'
import type { CommentRow } from './social'

export type MemeRow = {
  id: string; caption: string | null; image_url: string | null; joke_text: string | null
  created_at: string; author_id: string; is_hidden?: boolean; author: { username: string } | null
}
export type MemeStats = { reactions: Record<string, number>; mine: string | null; comment_count: number }
export type MemeWithStats = MemeRow & { stats: MemeStats }
export type MemeSort = 'new' | 'top'
export type TopRange = 'week' | 'all'

const COLS = 'id, caption, image_url, joke_text, created_at, author_id, is_hidden, author:profiles!memes_author_id_fkey(username)'
const EMPTY: MemeStats = { reactions: {}, mine: null, comment_count: 0 }
type Supa = NonNullable<Awaited<ReturnType<typeof createClient>>>

/** Reaction counts, the viewer's own reaction and visible comment counts for a page of memes. */
async function attachStats(supabase: Supa, memes: MemeRow[]): Promise<MemeWithStats[]> {
  if (!memes.length) return []
  const { data, error } = await supabase.rpc('meme_stats', { p_ids: memes.map((m) => m.id) })
  if (error) console.error('meme_stats', error.message)
  const byId = new Map(((data ?? []) as { meme_id: string; reactions: Record<string, number>; mine: string | null; comment_count: number }[])
    .map((s) => [s.meme_id, { reactions: s.reactions ?? {}, mine: s.mine, comment_count: Number(s.comment_count) }]))
  return memes.map((m) => ({ ...m, stats: byId.get(m.id) ?? EMPTY }))
}

/** A page of memes. New = newest first (author also sees own hidden ones); Top = most reactions (hidden never shown). */
export async function listMemes({ page, pageSize, sort, range, userId }: { page: number; pageSize: number; sort: MemeSort; range: TopRange; userId: string | null }) {
  const supabase = await createClient()
  if (!supabase) return { memes: [] as MemeWithStats[], hasMore: false }
  let rows: MemeRow[] = []
  if (sort === 'top') {
    const since = range === 'week' ? new Date(Date.now() - 7 * 864e5).toISOString() : null
    const { data: top, error } = await supabase.rpc('top_memes', { p_since: since, p_offset: (page - 1) * pageSize, p_limit: pageSize + 1 })
    if (error) console.error('top_memes', error.message)
    const ids = ((top ?? []) as { id: string }[]).map((t) => t.id)
    if (ids.length) {
      const { data } = await supabase.from('memes').select(COLS).in('id', ids)
      const byId = new Map(((data ?? []) as unknown as MemeRow[]).map((m) => [m.id, m]))
      rows = ids.map((id) => byId.get(id)).filter((m): m is MemeRow => Boolean(m))
    }
  } else {
    const { data } = await supabase.from('memes').select(COLS).or(visibleTo(userId))
      .order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize) // one extra row = "is there more?"
    rows = (data ?? []) as unknown as MemeRow[]
  }
  const hasMore = rows.length > pageSize
  return { memes: await attachStats(supabase, rows.slice(0, pageSize)), hasMore }
}

/** Newest visible memes for the main feed (hidden memes never appear there). */
export async function latestMemes(limit = 20): Promise<MemeWithStats[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const { data } = await supabase.from('memes').select(COLS).eq('is_hidden', false).order('created_at', { ascending: false }).limit(limit)
  return attachStats(supabase, (data ?? []) as unknown as MemeRow[])
}

/** One meme with stats + comments (viewer's own hidden comments included, badged). Null if not visible. */
export async function getMeme(id: string, userId: string | null, isAdmin = false) {
  const supabase = await createClient()
  if (!supabase || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  const [{ data: meme }, { data: comments }] = await Promise.all([
    supabase.from('memes').select(COLS).eq('id', id).or(parentVisibleTo(userId, isAdmin)).maybeSingle(),
    supabase.from('comments').select('id, body, created_at, edited_at, author_id, is_hidden, author:profiles(username)')
      .eq('meme_id', id).or(visibleTo(userId)).order('created_at', { ascending: true }).limit(100),
  ])
  if (!meme) return null
  const [withStats] = await attachStats(supabase, [meme as unknown as MemeRow])
  return { meme: withStats, comments: (comments ?? []) as unknown as CommentRow[] }
}

/** Newest visible memes by people the viewer follows (for the feed's Following tab). */
export async function followingMemes(limit = 20): Promise<MemeWithStats[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const { data: ids, error } = await supabase.rpc('following_meme_ids', { max_rows: limit })
  if (error) { console.error('following_meme_ids', error.message); return [] }
  const list = (ids ?? []) as string[]
  if (!list.length) return []
  const { data } = await supabase.from('memes').select(COLS).in('id', list).order('created_at', { ascending: false })
  return attachStats(supabase, (data ?? []) as unknown as MemeRow[])
}

export type MemeEditRow = {
  id: string
  caption: string | null
  joke_text: string | null
  image_url: string | null
  author_id: string
  is_hidden: boolean
}

/** Author edit page: one meme row by id (RLS still applies). Null if missing / bad id. */
export async function getMemeForEdit(id: string): Promise<MemeEditRow | null> {
  const supabase = await createClient()
  if (!supabase || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  const { data } = await supabase
    .from('memes')
    .select('id, caption, joke_text, image_url, author_id, is_hidden')
    .eq('id', id)
    .maybeSingle()
  return data
}
