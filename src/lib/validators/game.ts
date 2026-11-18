import { z } from 'zod'

/** Same values as HANGOVER_RATINGS in src/types/domain.ts (local so unit tests can import this file without path aliases). */
const HANGOVER = ['no_hangover', 'mild_hangover', 'two_day_hangover'] as const

export const GAME_LIST_LIMIT = 10
export const EQUIPMENT_ITEM_MAX = 60
export const TAG_ITEM_MAX = 40

const equipmentItem = z.string().max(EQUIPMENT_ITEM_MAX, `Each item up to ${EQUIPMENT_ITEM_MAX} characters`)
const tagItem = z.string().max(TAG_ITEM_MAX, `Each item up to ${TAG_ITEM_MAX} characters`)

export const gameSchema = z.object({
  title: z.string().min(3).max(80),
  summary: z.string().min(10).max(200),
  rules: z.string().min(20).max(5000),
  equipment: z.array(equipmentItem).max(GAME_LIST_LIMIT, 'Up to 10 items').default([]),
  minPlayers: z.coerce.number().int().min(1),
  maxPlayers: z.coerce.number().int().min(1).optional(),
  hangoverRating: z.enum(HANGOVER),
  tags: z.array(tagItem).max(GAME_LIST_LIMIT, 'Up to 10 items').default([]),
}).refine((g) => !g.maxPlayers || g.maxPlayers >= g.minPlayers, {
  message: 'Max players must be at least min players',
  path: ['maxPlayers'],
})

/** Splits "a, b ,c" into ['a','b','c'] (lowercased for tags). Does not cap the length. */
export const listItems = (v: FormDataEntryValue | null, lower = false) =>
  String(v ?? '')
    .split(',')
    .map((s) => (lower ? s.trim().toLowerCase() : s.trim()))
    .filter(Boolean)

export const variationSchema = z.object({
  title: z.string().min(3).max(80),
  rules: z.string().min(10).max(3000),
})

export type GameInput = z.infer<typeof gameSchema>

/** Read and trim the game form fields, then validate with gameSchema (shared by the server action and the form). */
export function gameFieldsFromForm(formData: FormData) {
  return gameSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    summary: String(formData.get('summary') ?? '').trim(),
    rules: String(formData.get('rules') ?? '').trim(),
    equipment: listItems(formData.get('equipment')),
    minPlayers: formData.get('minPlayers') || 2,
    maxPlayers: formData.get('maxPlayers') || undefined,
    hangoverRating: formData.get('hangoverRating'),
    tags: listItems(formData.get('tags'), true),
  })
}
