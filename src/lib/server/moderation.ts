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

/** Batched version of resolveTarget: one query per target type instead of one per item. */
export async function resolveTargets(
  supabase: SupabaseClient,
  items: { type: TargetType; id: string }[],
): Promise<ResolvedTarget[]> {
  const cut = (s: string | null | undefined) => (s ?? '').slice(0, 140)
  const missing: ResolvedTarget = { exists: false, href: null, preview: '(deleted)', hidden: false }
  const cols: Record<TargetType, string> = {
    game: 'id, title, summary, is_hidden',
    cocktail: 'id, name, description, is_hidden',
    comment: 'id, body, game_id, cocktail_id, is_hidden',
    variation: 'id, title, rules, game_id, is_hidden',
    cocktail_variation: 'id, title, rules, cocktail_id, is_hidden',
    meme: 'id, caption, joke_text, is_hidden',
  }
  type Row = Record<string, string | boolean | null>
  const byType = new Map<TargetType, Map<string, Row>>()
  const types = [...new Set(items.map((i) => i.type))]
  await Promise.all(
    types.map(async (type) => {
      const ids = [...new Set(items.filter((i) => i.type === type).map((i) => i.id))]
      const { data } = await supabase.from(TARGETS[type].table).select(cols[type]).in('id', ids)
      byType.set(type, new Map(((data ?? []) as unknown as Row[]).map((r) => [String(r.id), r])))
    }),
  )
  return items.map(({ type, id }) => {
    const r = byType.get(type)?.get(id)
    if (!r) return missing
    const s = (k: string) => (r[k] as string | null) ?? null
    const hidden = Boolean(r.is_hidden)
    switch (type) {
      case 'game': return { exists: true, href: `/games/${id}`, preview: `${s('title')}: ${cut(s('summary'))}`, hidden }
      case 'cocktail': return { exists: true, href: `/cocktails/${id}`, preview: `${s('name')}: ${cut(s('description'))}`, hidden }
      case 'comment': return { exists: true, href: s('game_id') ? `/games/${s('game_id')}` : `/cocktails/${s('cocktail_id')}`, preview: cut(s('body')), hidden }
      case 'variation': return { exists: true, href: `/games/${s('game_id')}`, preview: `${s('title')}: ${cut(s('rules'))}`, hidden }
      case 'cocktail_variation': return { exists: true, href: `/cocktails/${s('cocktail_id')}`, preview: `${s('title')}: ${cut(s('rules'))}`, hidden }
      case 'meme': return { exists: true, href: `/memes#meme-${id}`, preview: cut(s('caption') ?? s('joke_text') ?? '(image)'), hidden }
    }
  })
}
