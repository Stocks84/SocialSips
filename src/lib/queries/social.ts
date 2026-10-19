import type { SupabaseClient } from '@supabase/supabase-js'
import { visibleTo } from './visibility'

export type Author = { username: string } | null
export type CommentRow = { id: string; body: string; created_at: string; edited_at?: string | null; author_id: string; is_hidden?: boolean; author: Author }
export type VariationRow = { id: string; title: string; rules: string; created_at: string; edited_at?: string | null; author_id: string; is_hidden?: boolean; author: Author }
export type RatingSummary = { avg: number | null; count: number; mine: number | null }

const MAX_COMMENTS = 100
const MAX_VARIATIONS = 50

/**
 * Comments (latest 100), variations (latest 50) + rating summary for a game or cocktail.
 * Hidden items are excluded (even for admins), except the viewer's own (shown badged). Rating avg/count come from the rating_summary() RPC,
 * so we never download every rating.
 */
export async function getSocial(supabase: SupabaseClient, column: 'game_id' | 'cocktail_id', id: string, userId: string | null) {
  const variationTable = column === 'game_id' ? 'game_variations' : 'cocktail_variations'
  const [{ data: comments }, { data: variations }, { data: summary }, { data: mine }] = await Promise.all([
    supabase.from('comments').select('id, body, created_at, edited_at, author_id, is_hidden, author:profiles(username)')
      .eq(column, id).or(visibleTo(userId)).order('created_at', { ascending: false }).limit(MAX_COMMENTS),
    supabase.from(variationTable).select('id, title, rules, created_at, edited_at, author_id, is_hidden, author:profiles(username)')
      .eq(column, id).or(visibleTo(userId)).order('created_at', { ascending: false }).limit(MAX_VARIATIONS),
    supabase.rpc('rating_summary', column === 'game_id' ? { p_game: id } : { p_cocktail: id }),
    userId
      ? supabase.from('ratings').select('score').eq(column, id).eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const s = (Array.isArray(summary) ? summary[0] : summary) as { avg_score: number | string | null; rating_count: number | string } | null
  const count = Number(s?.rating_count ?? 0)
  const rating: RatingSummary = {
    avg: count && s?.avg_score != null ? Number(s.avg_score) : null,
    count,
    mine: (mine as { score: number } | null)?.score ?? null,
  }
  return {
    // fetched newest-first for the limit; shown oldest-first
    comments: ((comments ?? []) as unknown as CommentRow[]).reverse(),
    variations: ((variations ?? []) as unknown as VariationRow[]).reverse(),
    rating,
  }
}
