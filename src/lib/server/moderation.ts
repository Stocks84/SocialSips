import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Bucket } from './uploads'

export type TargetType = 'game' | 'comment' | 'variation' | 'cocktail' | 'cocktail_variation' | 'meme'

export const TARGETS: Record<TargetType, { table: string; label: string; bucket?: Bucket; imageCol?: string }> = {
  game: { table: 'games', label: 'Game', bucket: 'game-covers', imageCol: 'cover_image_url' },
  comment: { table: 'comments', label: 'Comment' },
  variation: { table: 'game_variations', label: 'Game variation' },
  cocktail: { table: 'cocktails', label: 'Cocktail', bucket: 'cocktails', imageCol: 'image_url' },
  cocktail_variation: { table: 'cocktail_variations', label: 'Cocktail variation' },
  meme: { table: 'memes', label: 'Meme', bucket: 'memes', imageCol: 'image_url' },
}

export type ResolvedTarget = { exists: boolean; href: string | null; preview: string; hidden: boolean }

/** Looks up a reported item (admin RLS sees hidden rows) → link + short preview. */
export async function resolveTarget(supabase: SupabaseClient, type: TargetType, id: string): Promise<ResolvedTarget> {
  const cut = (s: string | null | undefined) => (s ?? '').slice(0, 140)
  const missing = { exists: false, href: null, preview: '(deleted)', hidden: false }
  switch (type) {
    case 'game': {
      const { data } = await supabase.from('games').select('title, summary, is_hidden').eq('id', id).maybeSingle()
      return data ? { exists: true, href: `/games/${id}`, preview: `${data.title}: ${cut(data.summary)}`, hidden: data.is_hidden } : missing
    }
    case 'cocktail': {
      const { data } = await supabase.from('cocktails').select('name, description, is_hidden').eq('id', id).maybeSingle()
      return data ? { exists: true, href: `/cocktails/${id}`, preview: `${data.name}: ${cut(data.description)}`, hidden: data.is_hidden } : missing
    }
    case 'comment': {
      const { data } = await supabase.from('comments').select('body, game_id, cocktail_id, is_hidden').eq('id', id).maybeSingle()
      if (!data) return missing
      const href = data.game_id ? `/games/${data.game_id}` : `/cocktails/${data.cocktail_id}`
      return { exists: true, href, preview: cut(data.body), hidden: data.is_hidden }
    }
    case 'variation': {
      const { data } = await supabase.from('game_variations').select('title, rules, game_id, is_hidden').eq('id', id).maybeSingle()
      return data ? { exists: true, href: `/games/${data.game_id}`, preview: `${data.title}: ${cut(data.rules)}`, hidden: data.is_hidden } : missing
    }
    case 'cocktail_variation': {
      const { data } = await supabase.from('cocktail_variations').select('title, rules, cocktail_id, is_hidden').eq('id', id).maybeSingle()
      return data ? { exists: true, href: `/cocktails/${data.cocktail_id}`, preview: `${data.title}: ${cut(data.rules)}`, hidden: data.is_hidden } : missing
    }
    case 'meme': {
      const { data } = await supabase.from('memes').select('caption, joke_text, is_hidden').eq('id', id).maybeSingle()
      return data ? { exists: true, href: `/memes#meme-${id}`, preview: cut(data.caption ?? data.joke_text ?? '(image)'), hidden: data.is_hidden } : missing
    }
  }
}
