/**
 * Convenience re-exports for app code.
 * - Domain constants: src/types/domain.ts
 * - Generated DB types: src/types/supabase.ts
 */
import type { Database, Tables } from './supabase'

export { HANGOVER_LABELS, HANGOVER_RATINGS, type HangoverRating } from './domain'

export type Profile = Tables<'profiles'>
export type Game = Tables<'games'>
export type GameVariation = Tables<'game_variations'>
export type Comment = Tables<'comments'>
export type Rating = Tables<'ratings'>
export type Meme = Tables<'memes'>

/** Ingredient line on a cocktail (jsonb column; shape enforced in app validators). */
export type CocktailIngredient = { item: string; amount: string }

/** cocktails.ingredients is jsonb in Postgres; treat as typed lines in app code. */
export type Cocktail = Omit<Tables<'cocktails'>, 'ingredients'> & {
  ingredients: CocktailIngredient[] | null
}

/** Narrow hangover enum from generated Database (same values as HANGOVER_RATINGS). */
export type DbHangoverRating = Database['public']['Enums']['hangover_rating']
