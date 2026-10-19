import { createClient } from '@/lib/supabase/server'
import { mockGames } from '@/lib/mock-data'
import { HANGOVER_RATINGS, type HangoverRating } from '@/types/database'
import { parentVisibleTo } from './visibility'
import { getViewer } from '@/lib/server/viewer'
import { getSocial, type Author, type CommentRow, type RatingSummary, type VariationRow } from './social'

export type GameListItem = (typeof mockGames)[number] & { avg_rating: number | null; rating_count: number; created_at?: string }
export type FeedSort = 'newest' | 'top'

/** Feed query via the feed_games() RPC (search across title/summary/rules/tags, sort). Mock data if env missing. */
export async function listGames({ q = '', hangover = '', sort = 'newest' }: { q?: string; hangover?: string; sort?: string }): Promise<GameListItem[]> {
  const supabase = await createClient()
  const rating = HANGOVER_RATINGS.includes(hangover as HangoverRating) ? (hangover as HangoverRating) : null
  const term = q.trim().slice(0, 100)
  if (!supabase) {
    const t = term.toLowerCase()
    return mockGames
      .filter((g) => (!t || [g.title, g.summary, ...g.tags].join(' ').toLowerCase().includes(t)) && (!rating || g.hangover_rating === rating))
      .map((g) => ({ ...g, avg_rating: null, rating_count: 0 }))
  }
  const { data, error } = await supabase.rpc('feed_games', {
    q: term.replace(/[%_\\]/g, '') || null,
    hangover: rating,
    sort: sort === 'top' ? 'top' : 'newest',
  })
  if (error) {
    console.error('feed_games', error.message)
    return []
  }
  return ((data ?? []) as GameListItem[]).map((g) => ({
    ...g,
    avg_rating: g.avg_rating === null ? null : Number(g.avg_rating),
    rating_count: Number(g.rating_count),
  }))
}

export type GameDetail = {
  game: (typeof mockGames)[number] & {
    rules: string | null
    max_players: number | null
    equipment: string[]
    cover_image_url: string | null
    author_id: string | null
    is_hidden?: boolean
    author: Author
  }
  comments: CommentRow[]
  variations: VariationRow[]
  rating: RatingSummary
  userId: string | null
}

/** Everything the game page needs. Null if not found. */
export async function getGameDetail(id: string): Promise<GameDetail | null> {
  const supabase = await createClient()
  if (!supabase) {
    const g = mockGames.find((x) => x.id === id)
    if (!g) return null
    return {
      game: { ...g, rules: null, max_players: null, equipment: [], cover_image_url: null, author_id: null, author: null },
      comments: [], variations: [], rating: { avg: null, count: 0, mine: null }, userId: null,
    }
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  const { userId, isAdmin } = await getViewer()
  const user = userId ? { id: userId } : null
  const parentFilter = parentVisibleTo(userId, isAdmin)
  const [{ data: game }, social] = await Promise.all([
    supabase.from('games')
      .select('id, title, summary, rules, hangover_rating, min_players, max_players, equipment, tags, cover_image_url, author_id, is_hidden, author:profiles(username)')
      .eq('id', id).or(parentFilter).maybeSingle(),
    getSocial(supabase, 'game_id', id, user?.id ?? null),
  ])
  if (!game) return null
  return {
    game: game as unknown as GameDetail['game'],
    ...social,
    userId: user?.id ?? null,
  }
}

/** Newest games by people the viewer follows. */
export async function followingGames(): Promise<GameListItem[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const { data, error } = await supabase.rpc('following_feed_games', { max_rows: 50 })
  if (error) { console.error('following_feed_games', error.message); return [] }
  return ((data ?? []) as GameListItem[]).map((g) => ({ ...g, avg_rating: g.avg_rating === null ? null : Number(g.avg_rating), rating_count: Number(g.rating_count) }))
}
