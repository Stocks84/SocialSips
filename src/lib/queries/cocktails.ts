import { createClient } from '@/lib/supabase/server'
import { mockCocktails } from '@/lib/mock-data'
import type { Cocktail } from '@/types/database'
import { getSocial, type CommentRow, type RatingSummary } from './social'

export type CocktailListItem = Pick<Cocktail, 'id' | 'name' | 'description' | 'is_alcohol_free'>

export async function listCocktails(): Promise<CocktailListItem[]> {
  const supabase = await createClient()
  if (!supabase) return mockCocktails
  const { data } = await supabase.from('cocktails').select('id, name, description, is_alcohol_free').order('name')
  return (data ?? []) as CocktailListItem[]
}

export type CocktailDetail = {
  cocktail: CocktailListItem & Partial<Pick<Cocktail, 'ingredients' | 'method' | 'image_url'>>
  comments: CommentRow[]
  rating: RatingSummary
  userId: string | null
}

export async function getCocktailDetail(id: string): Promise<CocktailDetail | null> {
  const supabase = await createClient()
  if (!supabase) {
    const c = mockCocktails.find((x) => x.id === id)
    return c ? { cocktail: c, comments: [], rating: { avg: null, count: 0, mine: null }, userId: null } : null
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: cocktail }, social] = await Promise.all([
    supabase.from('cocktails').select('id, name, description, is_alcohol_free, ingredients, method, image_url').eq('id', id).maybeSingle(),
    getSocial(supabase, 'cocktail_id', id, user?.id ?? null),
  ])
  if (!cocktail) return null
  return { cocktail: cocktail as CocktailDetail['cocktail'], ...social, userId: user?.id ?? null }
}
