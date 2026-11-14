import { createClient } from '@/lib/supabase/server'
import { HANGOVER_RATINGS, type Game, type HangoverRating } from '@/types/database'
import { parentVisibleTo } from './visibility'
import { getViewer } from '@/lib/server/viewer'
import { PAGE_SIZE, rpcPage, type Cursor } from '@/lib/paging'
import { getSocial, type Author, type CommentRow, type RatingSummary, type VariationRow } from './social'

export type GameListItem = Pick<Game, 'id' | 'title' | 'summary' | 'hangover_rating' | 'min_players' | 'tags'> & {
  avg_rating: number | null
  rating_count: number
  created_at?: string
}
export type FeedSort = 'newest' | 'top'

const toListItem = (g: GameListItem): GameListItem => ({
  ...g,
  avg_rating: g.avg_rating === null ? null : Number(g.avg_rating),
  rating_count: Number(g.rating_count),
})

type GamePaging = { offset?: number; limit?: number; before?: Cursor | null }

/**
 * Feed query via the feed_games() RPC (search across title/summary/rules/tags, sort).
 * Newest pages by a (created_at, id) cursor; "top" pages by offset. Paging past the first
 * page needs migration 0032 (keyset / offset live inside the function).
 */
export async function listGames({ q = '', hangover = '', sort = 'newest', offset = 0, limit = PAGE_SIZE, before = null }: { q?: string; hangover?: string; sort?: string } & GamePaging): Promise<GameListItem[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const rating = HANGOVER_RATINGS.includes(hangover as HangoverRating) ? (hangover as HangoverRating) : null
  const term = q.trim().slice(0, 100)
  const top = sort === 'top'
  let query = supabase.rpc('feed_games', {
    q: term.replace(/[%_\\]/g, '') || null,
    hangover: rating,
    sort: top ? 'top' : 'newest',
    ...rpcPage({ limit, before, offset, top }),
  })
  if (top) query = query.order('avg_rating', { ascending: false, nullsFirst: false }).order('rating_count', { ascending: false })
  const { data, error } = await query.order('created_at', { ascending: false }).order('id', { ascending: false })
  if (error) {
    console.error('feed_games', error.message)
    return []
  }
  return ((data ?? []) as GameListItem[]).map(toListItem)
}

export type GameDetail = {
  game: GameListItem & {
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
  if (!supabase) return null
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

/** Newest games by people the viewer follows, optionally older than `before`. */
export async function followingGames({ limit = PAGE_SIZE, before = null }: GamePaging = {}): Promise<GameListItem[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const { data, error } = await supabase.rpc('following_feed_games', rpcPage({ limit, before }))
    .order('created_at', { ascending: false }).order('id', { ascending: false })
  if (error) { console.error('following_feed_games', error.message); return [] }
  return ((data ?? []) as GameListItem[]).map(toListItem)
}
