import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** "Download my data" (GDPR Art. 15/20): everything stored about the signed-in user, as JSON. */
export async function GET() {
  const supabase = await createClient()
  if (!supabase) return new NextResponse('Not configured', { status: 503 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Sign in first', { status: 401 })
  const uid = user.id
  const q = <T,>(p: PromiseLike<{ data: T | null }>) => Promise.resolve(p).then((r) => r.data ?? [])
  const [profile, games, cocktails, memes, comments, gameVariations, cocktailVariations, ratings, reactions, reports, blocks, entries, votes, notices] = await Promise.all([
    supabase.rpc('my_profile').then((r) => r.data),
    q(supabase.from('games').select('*').eq('author_id', uid)),
    q(supabase.from('cocktails').select('*').eq('author_id', uid)),
    q(supabase.from('memes').select('*').eq('author_id', uid)),
    q(supabase.from('comments').select('*').eq('author_id', uid)),
    q(supabase.from('game_variations').select('*').eq('author_id', uid)),
    q(supabase.from('cocktail_variations').select('*').eq('author_id', uid)),
    q(supabase.from('ratings').select('*').eq('user_id', uid)),
    q(supabase.from('meme_reactions').select('meme_id, emoji, created_at').eq('user_id', uid)),
    q(supabase.from('reports').select('id, target_type, target_id, target_url, reason, note, reporter_email, status, outcome, created_at, decided_at').eq('reporter_id', uid)),
    q(supabase.from('blocks').select('blocked_id, created_at, blocked:profiles!blocks_blocked_id_fkey(username)').eq('blocker_id', uid)),
    q(supabase.from('challenge_entries').select('challenge_id, meme_id, cocktail_variation_id, created_at').eq('user_id', uid)),
    q(supabase.from('challenge_votes').select('challenge_id, entry_id, created_at').eq('voter_id', uid)),
    q(supabase.from('moderation_notices').select('target_type, target_id, reason, explanation, preview, created_at, reversed_at').eq('author_id', uid)),
  ])
  const body = {
    exported_at: new Date().toISOString(),
    account: { id: uid, email: user.email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at },
    profile, games, cocktails, memes, comments, game_variations: gameVariations, cocktail_variations: cocktailVariations,
    ratings, meme_reactions: reactions, reports_filed: reports, blocked_users: blocks, moderation_notices: notices, challenge_entries: entries, challenge_votes: votes,
    note: 'Uploaded images are linked by URL in the items above.',
  }
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="social-sips-data-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
