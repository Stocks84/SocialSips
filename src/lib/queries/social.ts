import type { SupabaseClient } from '@supabase/supabase-js'

export type Author = { username: string } | null
export type CommentRow = { id: string; body: string; created_at: string; author_id: string; author: Author }
export type RatingSummary = { avg: number | null; count: number; mine: number | null }

/** Comments + rating summary for a game or cocktail. */
export async function getSocial(supabase: SupabaseClient, column: 'game_id' | 'cocktail_id', id: string, userId: string | null) {
  const [{ data: comments }, { data: ratings }] = await Promise.all([
    supabase.from('comments').select('id, body, created_at, author_id, author:profiles(username)')
      .eq(column, id).order('created_at', { ascending: true }),
    supabase.from('ratings').select('user_id, score').eq(column, id),
  ])
  const scores = (ratings ?? []) as { user_id: string; score: number }[]
  const rating: RatingSummary = {
    avg: scores.length ? scores.reduce((a, r) => a + r.score, 0) / scores.length : null,
    count: scores.length,
    mine: scores.find((r) => r.user_id === userId)?.score ?? null,
  }
  return { comments: (comments ?? []) as unknown as CommentRow[], rating }
}
