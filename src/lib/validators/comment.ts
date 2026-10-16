import { z } from 'zod'

export const commentSchema = z.object({ body: z.string().min(1).max(1000) })
export const ratingSchema = z.object({ score: z.coerce.number().int().min(1).max(5) })
