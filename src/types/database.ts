/**
 * Database types for Social Sips.
 * Hand-written to match supabase/migrations/0001_init.sql.
 * Regenerate later with: npx supabase gen types typescript --linked > src/types/supabase.ts
 */

export const HANGOVER_RATINGS = ['no_hangover', 'mild_hangover', 'two_day_hangover'] as const
export type HangoverRating = (typeof HANGOVER_RATINGS)[number]

export const HANGOVER_LABELS: Record<HangoverRating, { label: string; emoji: string; badge: string }> = {
  no_hangover: { label: 'No Hangover', emoji: '😇', badge: 'badge-no-hangover' },
  mild_hangover: { label: 'Mild Hangover', emoji: '🤕', badge: 'badge-mild' },
  two_day_hangover: { label: 'Two-Day Hangover', emoji: '💀', badge: 'badge-two-day' },
}

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  date_of_birth: string
  /** When the user ticked "I confirm I am 18 or over" at sign-up */
  age_confirmed_at: string
  favourite_drink: string | null
  party_vibe: string | null
  created_at: string
}

export interface Game {
  id: string
  author_id: string
  title: string
  slug: string
  summary: string
  rules: string
  equipment: string[]
  min_players: number
  max_players: number | null
  hangover_rating: HangoverRating
  tags: string[]
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

export interface GameVariation {
  id: string
  game_id: string
  author_id: string
  title: string
  rules: string
  created_at: string
}

export interface Comment {
  id: string
  author_id: string
  game_id: string | null
  cocktail_id: string | null
  body: string
  created_at: string
}

export interface Rating {
  id: string
  user_id: string
  game_id: string | null
  cocktail_id: string | null
  score: 1 | 2 | 3 | 4 | 5
  created_at: string
}

export interface Cocktail {
  id: string
  author_id: string | null
  name: string
  description: string
  ingredients: { item: string; amount: string }[]
  method: string
  is_alcohol_free: boolean
  image_url: string | null
  created_at: string
}

export interface Meme {
  id: string
  author_id: string
  caption: string | null
  image_url: string | null
  joke_text: string | null
  created_at: string
}
