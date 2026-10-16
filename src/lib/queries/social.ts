import type { SupabaseClient } from '@supabase/supabase-js'

export type Author = { username: string } | null
export type CommentRow = { id: string; body: string; created_at: string; author_id: string; author: Author }
export type VariationRow = { id: string; title: string; rules: string; created_at: string; author_id: string; author: Author }
export type RatingSummary = { avg: number | null; count: number; mine: number | null }

/** Comments, variations + rating summary for a game or cocktail. Hidden items are excluded (even for admins). */
export async function getSocial(supabase: SupabaseClient, column: 'game_id' | 'cocktail_id', id: string, userId: string | null) {
  const variationTable = column === 'game_id' ? 'game_variations' : 'cocktail_variations'
  const [{ data: comments }, { data: variations }, { data: ratings }] = await Promise.all([
    supabase.from('comments').select('id, body, created_at, author_id, author:profiles(username)')
      .eq(column, id).eq('is_hidden', false).order('created_at', { ascending: true }),
    supabase.from(variationTable).select('id, title, rules, created_at, author_id, author:profiles(username)')
      .eq(column, id).eq('is_hidden', false).order('created_at', { ascending: true }),
    supabase.from('ratings').select('user_id, score').eq(column, id),
  ])
  const scores = (ratings ?? []) as { user_id: string; score: number }[]
  const rating: RatingSummary = {
    avg: scores.length ? scores.reduce((a, r) => a + r.score, 0) / scores.length : null,
    count: scores.length,
    mine: scores.find((r) => r.user_id === userId)?.score ?? null,
  }
  return {
    comments: (comments ?? []) as unknown as CommentRow[],
    variations: (variations ?? []) as unknown as VariationRow[],
    rating,
  }
}
