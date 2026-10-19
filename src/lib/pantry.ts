/**
 * "What can I make?" — a fixed bar list that recipe lines are matched against (recipes are free text).
 * A recipe line is covered when the user ticked any pantry item whose pattern matches it, so
 * "Bourbon or rye whiskey" is covered by Whiskey, and "Lemon twist or olive" by Lemons or Olives.
 * Lines marked "(optional)" never count as missing. Lines no pantry item matches count as missing by name.
 */
export type PantryItem = { key: string; label: string; match: RegExp }
export type PantryGroup = { title: string; items: PantryItem[] }

export const PANTRY: PantryGroup[] = [
  { title: 'Spirits', items: [
    { key: 'gin', label: 'Gin', match: /\bgin\b/ },
    { key: 'vodka', label: 'Vodka', match: /\bvodka\b/ },
    { key: 'rum', label: 'Rum', match: /\b(rum|rhum|cachaça)\b/ },
    { key: 'tequila', label: 'Tequila', match: /\b(tequila|mezcal)\b/ },
    { key: 'whiskey', label: 'Whiskey (bourbon, rye)', match: /\b(whiske?y|bourbon|rye|scotch)\b/ },
  ] },
  { title: 'Liqueurs & vermouth', items: [
    { key: 'triple_sec', label: 'Triple sec / Cointreau', match: /\b(triple sec|cointreau|orange curaçao|orange curacao)\b/ },
    { key: 'blue_curacao', label: 'Blue curaçao', match: /\bblue cura[çc]ao\b/ },
    { key: 'campari', label: 'Campari', match: /\bcampari\b/ },
    { key: 'aperol', label: 'Aperol', match: /\baperol\b/ },
    { key: 'coffee_liqueur', label: 'Coffee liqueur', match: /\b(coffee liqueur|kahl[uú]a)\b/ },
    { key: 'sweet_vermouth', label: 'Sweet vermouth', match: /\b(sweet|rosso) vermouth\b/ },
    { key: 'dry_vermouth', label: 'Dry vermouth', match: /\bdry vermouth\b/ },
  ] },
  { title: 'Mixers', items: [
    { key: 'soda', label: 'Soda water', match: /^(soda|soda water|club soda|sparkling water)$/ },
    { key: 'tonic', label: 'Tonic', match: /\btonic\b/ },
    { key: 'ginger_beer', label: 'Ginger beer', match: /\bginger beer\b/ },
    { key: 'grapefruit_soda', label: 'Grapefruit soda', match: /\bgrapefruit soda\b/ },
    { key: 'prosecco', label: 'Prosecco / sparkling wine', match: /\b(prosecco|champagne|sparkling wine|cava)\b/ },
    { key: 'cranberry', label: 'Cranberry juice', match: /\bcranberry\b/ },
    { key: 'pineapple', label: 'Pineapple juice', match: /\bpineapple\b/ },
    { key: 'espresso', label: 'Espresso', match: /\b(espresso|coffee)\b(?! liqueur)/ },
    { key: 'coconut', label: 'Cream of coconut', match: /\b(cream of coconut|coconut cream)\b/ },
  ] },
  { title: 'Fresh', items: [
    { key: 'lime', label: 'Limes', match: /\blimes?\b/ },
    { key: 'lemon', label: 'Lemons', match: /\blemons?\b/ },
    { key: 'orange', label: 'Oranges', match: /\boranges?\b(?! curaçao| curacao)/ },
    { key: 'mint', label: 'Mint', match: /\bmint\b/ },
    { key: 'egg', label: 'Eggs', match: /\begg\b/ },
  ] },
  { title: 'Basics & garnish', items: [
    { key: 'sugar', label: 'Sugar / sugar syrup', match: /\bsugar\b|\bsimple syrup\b/ },
    { key: 'bitters', label: 'Angostura bitters', match: /\bbitters\b/ },
    { key: 'orgeat', label: 'Orgeat (almond syrup)', match: /\borgeat\b/ },
    { key: 'salt', label: 'Salt', match: /\bsalt\b/ },
    { key: 'cherry', label: 'Cocktail cherries', match: /\bcherr(y|ies)\b/ },
    { key: 'olive', label: 'Olives', match: /\bolives?\b/ },
  ] },
]

export const PANTRY_ITEMS: PantryItem[] = PANTRY.flatMap((g) => g.items)
const KEYS = new Set(PANTRY_ITEMS.map((i) => i.key))

export type RecipeLine = { item: string; amount?: string }
export type MakeableCocktail = { id: string; name: string; description: string; is_alcohol_free: boolean; image_url: string | null; ingredients: RecipeLine[] }
export type CocktailMatch = MakeableCocktail & { missing: string[]; needed: number }

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
const isOptional = (item: string) => /\boptional\b/i.test(item)

/** Pantry keys that can cover this recipe line (empty = nothing in our list matches it). */
export function keysFor(item: string): string[] {
  const t = norm(item.replace(/\(optional\)/i, ''))
  return PANTRY_ITEMS.filter((p) => p.match.test(t)).map((p) => p.key)
}

/** Recipe lines the user can't cover with what they ticked. */
export function missingFor(c: MakeableCocktail, have: ReadonlySet<string>): string[] {
  const lines = (Array.isArray(c.ingredients) ? c.ingredients : []).filter((l) => l && typeof l.item === 'string' && l.item.trim() && !isOptional(l.item))
  return lines.filter((l) => !keysFor(l.item).some((k) => have.has(k))).map((l) => l.item.trim())
}

/** Makeable now (nothing missing) and near misses (1–2 missing), each sorted by fewest ingredients, then name. */
export function matchCocktails(cocktails: MakeableCocktail[], have: ReadonlySet<string>) {
  const scored: CocktailMatch[] = cocktails.map((c) => {
    const missing = missingFor(c, have)
    return { ...c, missing, needed: (c.ingredients ?? []).filter((l) => !isOptional(l.item)).length }
  })
  const order = (a: CocktailMatch, b: CocktailMatch) => a.missing.length - b.missing.length || a.needed - b.needed || a.name.localeCompare(b.name)
  return {
    canMake: scored.filter((c) => c.missing.length === 0).sort(order),
    nearMiss: scored.filter((c) => c.missing.length > 0 && c.missing.length <= 2).sort(order),
  }
}

/** Keeps only known pantry keys from saved / URL input. */
export function parsePantry(raw: string | null | undefined): string[] {
  if (!raw) return []
  let list: unknown = raw
  try { list = JSON.parse(raw) } catch { list = raw.split(',') }
  return Array.isArray(list) ? [...new Set(list.filter((k): k is string => typeof k === 'string' && KEYS.has(k)))] : []
}
