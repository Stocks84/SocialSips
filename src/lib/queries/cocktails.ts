import { createClient } from '@/lib/supabase/server'
import { mockCocktails } from '@/lib/mock-data'
import type { Cocktail } from '@/types/database'
import { getSocial, type Author, type CommentRow, type RatingSummary, type VariationRow } from './social'

export type CocktailListItem = Pick<Cocktail, 'id' | 'name' | 'description' | 'is_alcohol_free'> & {
  image_url?: string | null
  avg_rating?: number | null
  rating_count?: number
}

/** Cocktail list via feed_cocktails() RPC: search name/description/ingredients, alcohol-free filter, sort. */
export async function listCocktails({ q = '', alcoholFree = false, sort = 'newest' }: { q?: string; alcoholFree?: boolean; sort?: string } = {}): Promise<CocktailListItem[]> {
  const supabase = await createClient()
  const term = q.trim().slice(0, 100)
  if (!supabase) {
    const t = term.toLowerCase()
    return mockCocktails.filter((c) => (!t || `${c.name} ${c.description}`.toLowerCase().includes(t)) && (!alcoholFree || c.is_alcohol_free))
  }
  const { data, error } = await supabase.rpc('feed_cocktails', {
    q: term.replace(/[%_\\]/g, '') || null,
    alcohol_free: alcoholFree,
    sort: sort === 'top' ? 'top' : 'newest',
  })
  if (error) {
    console.error('feed_cocktails', error.message)
    return []
  }
  return ((data ?? []) as CocktailListItem[]).map((c) => ({
    ...c,
    avg_rating: c.avg_rating == null ? null : Number(c.avg_rating),
    rating_count: Number(c.rating_count ?? 0),
  }))
}

export type CocktailDetail = {
  cocktail: CocktailListItem & Partial<Pick<Cocktail, 'ingredients' | 'method' | 'image_url' | 'author_id'>> & { author?: Author }
  comments: CommentRow[]
  variations: VariationRow[]
  rating: RatingSummary
  userId: string | null
}

export async function getCocktailDetail(id: string): Promise<CocktailDetail | null> {
  const supabase = await createClient()
  if (!supabase) {
    const c = mockCocktails.find((x) => x.id === id)
    return c ? { cocktail: c, comments: [], variations: [], rating: { avg: null, count: 0, mine: null }, userId: null } : null
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: cocktail }, social] = await Promise.all([
    supabase.from('cocktails')
      .select('id, name, description, is_alcohol_free, ingredients, method, image_url, author_id, author:profiles(username)')
      .eq('id', id).eq('is_hidden', false).maybeSingle(),
    getSocial(supabase, 'cocktail_id', id, user?.id ?? null),
  ])
  if (!cocktail) return null
  return { cocktail: cocktail as unknown as CocktailDetail['cocktail'], ...social, userId: user?.id ?? null }
}
