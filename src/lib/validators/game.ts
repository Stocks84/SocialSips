import { z } from 'zod'

/** Same values as HANGOVER_RATINGS in src/types/domain.ts (local so unit tests can import this file without path aliases). */
const HANGOVER = ['no_hangover', 'mild_hangover', 'two_day_hangover'] as const

export const gameSchema = z.object({
  title: z.string().min(3).max(80),
  summary: z.string().min(10).max(200),
  rules: z.string().min(20).max(5000),
  equipment: z.array(z.string().max(60)).default([]),
  minPlayers: z.coerce.number().int().min(1),
  maxPlayers: z.coerce.number().int().min(1).optional(),
  hangoverRating: z.enum(HANGOVER),
  tags: z.array(z.string().max(40)).default([]),
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

/** Same as listItems, capped at 10 (what we store). */
export const splitList = (v: FormDataEntryValue | null, lower = false) => listItems(v, lower).slice(0, 10)

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
    equipment: splitList(formData.get('equipment')),
    minPlayers: formData.get('minPlayers') || 2,
    maxPlayers: formData.get('maxPlayers') || undefined,
    hangoverRating: formData.get('hangoverRating'),
    tags: splitList(formData.get('tags'), true),
  })
}
