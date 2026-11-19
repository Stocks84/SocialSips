import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { commentHref } from '@/lib/report-url'
import { wordingFlagTexts, type WordingFlagMatch } from '@/lib/wording-flag'

export type FlaggedKind = 'game' | 'comment' | 'dare' | 'game_variation' | 'drink_variation' | 'meme'

export type FlaggedWordingItem = {
  kind: FlaggedKind
  id: string
  href: string | null
  title: string
  excerpt: string
  createdAt: string | null
  match: WordingFlagMatch
}

const SCAN_LIMIT = 200
const EXCERPT = 180

function cut(text: string | null | undefined): string {
  const t = (text ?? '').replace(/\s+/g, ' ').trim()
  if (t.length <= EXCERPT) return t
  return `${t.slice(0, EXCERPT - 1).trimEnd()}…`
}

function push(
  out: FlaggedWordingItem[],
  item: Omit<FlaggedWordingItem, 'match'> & { parts: Array<string | null | undefined> },
) {
  const match = wordingFlagTexts(item.parts)
  if (!match) return
  out.push({
    kind: item.kind,
    id: item.id,
    href: item.href,
    title: item.title,
    excerpt: item.excerpt,
    createdAt: item.createdAt,
    match,
  })
}

/** Recent posts, comments and Dares whose wording matches the admin flag list. Computed in the admin view — no new column. */
export async function listFlaggedWording(): Promise<FlaggedWordingItem[] | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const [games, comments, dares, gameVars, drinkVars, memes] = await Promise.all([
    supabase.from('games').select('id, title, summary, rules, created_at').order('created_at', { ascending: false }).limit(SCAN_LIMIT),
    supabase.from('comments').select('id, body, game_id, cocktail_id, meme_id, created_at').order('created_at', { ascending: false }).limit(SCAN_LIMIT),
    supabase.from('challenges').select('id, theme, description, created_at').order('starts_on', { ascending: false }).limit(SCAN_LIMIT),
    supabase.from('game_variations').select('id, game_id, title, rules, created_at').order('created_at', { ascending: false }).limit(SCAN_LIMIT),
    supabase.from('cocktail_variations').select('id, cocktail_id, title, rules, created_at').order('created_at', { ascending: false }).limit(SCAN_LIMIT),
    supabase.from('memes').select('id, caption, joke_text, created_at').order('created_at', { ascending: false }).limit(SCAN_LIMIT),
  ])

  for (const [label, res] of [
    ['games', games],
    ['comments', comments],
    ['challenges', dares],
    ['game_variations', gameVars],
    ['cocktail_variations', drinkVars],
    ['memes', memes],
  ] as const) {
    if (res.error) console.error('wording flag scan', label, res.error.message)
  }

  const out: FlaggedWordingItem[] = []

  for (const g of games.data ?? []) {
    push(out, {
      kind: 'game',
      id: g.id,
      href: `/games/${g.id}`,
      title: g.title ?? 'Game',
      excerpt: cut(g.rules || g.summary),
      createdAt: g.created_at,
      parts: [g.title, g.summary, g.rules],
    })
  }
  for (const c of comments.data ?? []) {
    const href = commentHref({ game_id: c.game_id, cocktail_id: c.cocktail_id, meme_id: c.meme_id }, c.id)
    push(out, {
      kind: 'comment',
      id: c.id,
      href,
      title: 'Comment',
      excerpt: cut(c.body),
      createdAt: c.created_at,
      parts: [c.body],
    })
  }
  for (const d of dares.data ?? []) {
    push(out, {
      kind: 'dare',
      id: d.id,
      href: `/challenge/${d.id}`,
      title: d.theme ?? 'Dare',
      excerpt: cut(d.description || d.theme),
      createdAt: d.created_at,
      parts: [d.theme, d.description],
    })
  }
  for (const v of gameVars.data ?? []) {
    push(out, {
      kind: 'game_variation',
      id: v.id,
      href: `/games/${v.game_id}`,
      title: v.title ?? 'House rules',
      excerpt: cut(v.rules),
      createdAt: v.created_at,
      parts: [v.title, v.rules],
    })
  }
  for (const v of drinkVars.data ?? []) {
    push(out, {
      kind: 'drink_variation',
      id: v.id,
      href: `/cocktails/${v.cocktail_id}`,
      title: v.title ?? 'Drink twist',
      excerpt: cut(v.rules),
      createdAt: v.created_at,
      parts: [v.title, v.rules],
    })
  }
  for (const m of memes.data ?? []) {
    push(out, {
      kind: 'meme',
      id: m.id,
      href: `/memes/${m.id}`,
      title: m.caption || 'Meme',
      excerpt: cut(m.joke_text || m.caption),
      createdAt: m.created_at,
      parts: [m.caption, m.joke_text],
    })
  }

  out.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  return out
}
