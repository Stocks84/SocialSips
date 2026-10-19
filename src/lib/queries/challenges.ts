import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { BoardEntry, Challenge } from '@/lib/challenge'

const COLS = 'id, starts_on, theme, kind, description, is_default'

/** This week's challenge (creates the default one if an admin hasn't scheduled any). */
export const getCurrentChallenge = cache(async (): Promise<Challenge | null> => {
  const supabase = await createClient()
  if (!supabase) return null
  const { data, error } = await supabase.rpc('current_challenge')
  if (error) { console.error('current_challenge', error.message); return null }
  return ((data as Challenge[] | null)?.[0]) ?? null
})

export async function getChallenge(id: string): Promise<Challenge | null> {
  const supabase = await createClient()
  if (!supabase) return null
  const { data } = await supabase.from('challenges').select(COLS).eq('id', id).maybeSingle()
  return (data as Challenge | null) ?? null
}

export async function getBoard(id: string): Promise<BoardEntry[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const { data, error } = await supabase.rpc('challenge_board', { p_challenge: id })
  if (error) { console.error('challenge_board', error.message); return [] }
  return ((data ?? []) as BoardEntry[]).map((e) => ({ ...e, votes: Number(e.votes) }))
}

export async function getWinner(id: string): Promise<{ entry_id: string; user_id: string; username: string; votes: number } | null> {
  const supabase = await createClient()
  if (!supabase) return null
  const { data } = await supabase.rpc('challenge_winner', { p_challenge: id })
  const w = (data as { entry_id: string; user_id: string; username: string; votes: number }[] | null)?.[0]
  return w ? { ...w, votes: Number(w.votes) } : null
}

export async function listChallenges(opts: { before?: string; from?: string; limit?: number }): Promise<Challenge[]> {
  const supabase = await createClient()
  if (!supabase) return []
  let q = supabase.from('challenges').select(COLS)
  if (opts.before) q = q.lt('starts_on', opts.before).order('starts_on', { ascending: false })
  if (opts.from) q = q.gt('starts_on', opts.from).order('starts_on', { ascending: true })
  const { data } = await q.limit(opts.limit ?? 12)
  return (data ?? []) as Challenge[]
}

export async function getUserWins(userId: string): Promise<{ challenge_id: string; theme: string; starts_on: string; votes: number }[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const { data, error } = await supabase.rpc('user_challenge_wins', { p_user: userId })
  if (error) { console.error('user_challenge_wins', error.message); return [] }
  return (data ?? []) as { challenge_id: string; theme: string; starts_on: string; votes: number }[]
}
