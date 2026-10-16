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

export async function getGame(id: string) {
  const supabase = await createClient()
  if (!supabase) {
    const g = mockGames.find((x) => x.id === id)
    return g ? { ...g, rules: null as string | null } : null
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data } = await supabase
    .from('games')
    .select('id, title, summary, rules, hangover_rating, min_players, tags')
    .eq('id', id)
    .maybeSingle()
  return data as (GameListItem & { rules: string | null }) | null
}
