import { z } from 'zod'
import { HANGOVER_RATINGS } from '@/types/database'

export const gameSchema = z.object({
  title: z.string().min(3).max(80),
  summary: z.string().min(10).max(200),
  rules: z.string().min(20),
  equipment: z.array(z.string()).default([]),
  minPlayers: z.coerce.number().int().min(1),
  maxPlayers: z.coerce.number().int().min(1).optional(),
  hangoverRating: z.enum(HANGOVER_RATINGS),
  tags: z.array(z.string()).default([]),
})

export const variationSchema = z.object({
  title: z.string().min(3).max(80),
  rules: z.string().min(10),
})

export type GameInput = z.infer<typeof gameSchema>
