import type { Cocktail, Game } from '@/types/database'

/** Placeholder content so pages render before Supabase is connected. Mirrors supabase/seed.sql. */
export const mockGames: Pick<Game, 'id' | 'title' | 'summary' | 'hangover_rating' | 'min_players' | 'tags'>[] = [
  { id: 'neon-never', title: 'Neon Never Have I Ever', summary: 'The classic, with glow sticks for points.', hangover_rating: 'mild_hangover', min_players: 3, tags: ['classic', 'party'] },
  { id: 'cosmic-cups', title: 'Cosmic Cups', summary: 'Flip-cup relay where the losing team names the next planet.', hangover_rating: 'two_day_hangover', min_players: 6, tags: ['team', 'fast'] },
  { id: 'mocktail-mafia', title: 'Mocktail Mafia', summary: 'Social deduction, played with mocktails.', hangover_rating: 'no_hangover', min_players: 5, tags: ['strategy', 'alcohol-free'] },
]

export const mockCocktails: Pick<Cocktail, 'id' | 'name' | 'description' | 'is_alcohol_free'>[] = [
  { id: 'purple-haze', name: 'Purple Haze Spritz', description: 'Butterfly-pea gin, tonic and a squeeze of lemon. Watch it change colour.', is_alcohol_free: false },
  { id: 'cyan-cooler', name: 'Cyan Cooler', description: 'Blue curaçao, pineapple and soda over crushed ice.', is_alcohol_free: false },
  { id: 'virgin-neon', name: 'Virgin Neon Mule', description: 'Ginger beer, lime and mint. Zero hangover.', is_alcohol_free: true },
]
