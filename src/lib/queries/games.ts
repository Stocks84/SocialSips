import { createClient } from '@/lib/supabase/server'
import { mockGames } from '@/lib/mock-data'
import { HANGOVER_RATINGS, type HangoverRating } from '@/types/database'

export type GameListItem = (typeof mockGames)[number]

/** Feed query. Reads from Supabase; falls back to mock data only when env is missing. */
export async function listGames({ q = '', hangover = '' }: { q?: string; hangover?: string }): Promise<GameListItem[]> {
  const supabase = await createClient()
  const rating = HANGOVER_RATINGS.includes(hangover as HangoverRating) ? (hangover as HangoverRating) : null
  if (!supabase) {
    return mockGames.filter(
      (g) => (!q || g.title.toLowerCase().includes(q.toLowerCase())) && (!rating || g.hangover_rating === rating),
    )
  }
  let query = supabase
    .from('games')
    .select('id, title, summary, hangover_rating, min_players, tags')
    .order('created_at', { ascending: false })
    .limit(50)
  if (q) query = query.ilike('title', `%${q.replace(/[%_]/g, '')}%`)
  if (rating) query = query.eq('hangover_rating', rating)
  const { data, error } = await query
  if (error) {
    console.error('listGames', error.message)
    return []
  }
  return data as GameListItem[]
}


type Author = { username: string } | null
export type GameDetail = {
  game: GameListItem & {
    rules: string | null
    max_players: number | null
    equipment: string[]
    cover_image_url: string | null
    author: Author
  }
  comments: { id: string; body: string; created_at: string; author_id: string; author: Author }[]
  variations: { id: string; title: string; rules: string; created_at: string; author_id: string; author: Author }[]
  rating: { avg: number | null; count: number; mine: number | null }
  userId: string | null
}

/** Everything the game page needs, in parallel. Null if not found. */
export async function getGameDetail(id: string): Promise<GameDetail | null> {
  const supabase = await createClient()
  if (!supabase) {
    const g = mockGames.find((x) => x.id === id)
    if (!g) return null
    return {
      game: { ...g, rules: null, max_players: null, equipment: [], cover_image_url: null, author: null },
      comments: [], variations: [], rating: { avg: null, count: 0, mine: null }, userId: null,
    }
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const [{ data: game }, { data: comments }, { data: variations }, { data: ratings }, { data: { user } }] = await Promise.all([
    supabase.from('games')
      .select('id, title, summary, rules, hangover_rating, min_players, max_players, equipment, tags, cover_image_url, author:profiles(username)')
      .eq('id', id).maybeSingle(),
    supabase.from('comments').select('id, body, created_at, author_id, author:profiles(username)')
      .eq('game_id', id).order('created_at', { ascending: true }),
    supabase.from('game_variations').select('id, title, rules, created_at, author_id, author:profiles(username)')
      .eq('game_id', id).order('created_at', { ascending: true }),
    supabase.from('ratings').select('user_id, score').eq('game_id', id),
    supabase.auth.getUser(),
  ])
  if (!game) return null
  const scores = (ratings ?? []) as { user_id: string; score: number }[]
  return {
    game: game as unknown as GameDetail['game'],
    comments: (comments ?? []) as unknown as GameDetail['comments'],
    variations: (variations ?? []) as unknown as GameDetail['variations'],
    rating: {
      avg: scores.length ? scores.reduce((a, r) => a + r.score, 0) / scores.length : null,
      count: scores.length,
      mine: scores.find((r) => r.user_id === user?.id)?.score ?? null,
    },
    userId: user?.id ?? null,
  }
}
