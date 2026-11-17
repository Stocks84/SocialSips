import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getChallenge, getCurrentChallenge } from '@/lib/queries/challenges'
import { UUID } from '@/lib/server/auth'
import type { Challenge } from '@/lib/challenge'

/**
 * Minimal rows for share previews and OG images. Only public columns, and only rows an anonymous
 * visitor could see (is_hidden = false), whoever is signed in. Runs as the anon/RLS client — no service role.
 * Null for a malformed id, a missing row or a hidden one, so callers can't tell those apart.
 */
export type SharedGame = { id: string; title: string; summary: string; hangover_rating: string; min_players: number; max_players: number | null; cover_image_url: string | null }
export type SharedCocktail = { id: string; name: string; description: string | null; is_alcohol_free: boolean; image_url: string | null }

export async function getSharedGame(id: string): Promise<SharedGame | null> {
  const supabase = await createClient()
  if (!supabase || !UUID.test(id)) return null
  const { data } = await supabase.from('games')
    .select('id, title, summary, hangover_rating, min_players, max_players, cover_image_url')
    .eq('id', id).eq('is_hidden', false).maybeSingle()
  return (data as SharedGame | null) ?? null
}

export async function getSharedCocktail(id: string): Promise<SharedCocktail | null> {
  const supabase = await createClient()
  if (!supabase || !UUID.test(id)) return null
  const { data } = await supabase.from('cocktails')
    .select('id, name, description, is_alcohol_free, image_url')
    .eq('id', id).eq('is_hidden', false).maybeSingle()
  return (data as SharedCocktail | null) ?? null
}

export async function getSharedChallenge(id: string): Promise<Challenge | null> {
  return UUID.test(id) ? getChallenge(id) : null
}

/** This week's challenge for the /challenge share card. Same public columns as getSharedChallenge; null if none is active. */
export async function getSharedCurrentChallenge(): Promise<Challenge | null> {
  return getCurrentChallenge()
}
