import { z } from 'zod'

export const commentSchema = z.object({ body: z.string().min(1).max(1000) })
export const ratingSchema = z.object({ score: z.coerce.number().int().min(1).max(5) })

export const REPORT_REASONS = {
  spam: 'Spam or advertising',
  harassment: 'Harassment or bullying',
  dangerous: 'Dangerous drinking / unsafe',
  underage: 'Involves under-18s',
  hate: 'Hate speech',
  other: 'Something else',
} as const

export const reportSchema = z.object({
  targetType: z.enum(['game', 'comment', 'variation', 'cocktail']),
  targetId: z.string().uuid(),
  reason: z.enum(Object.keys(REPORT_REASONS) as [keyof typeof REPORT_REASONS, ...(keyof typeof REPORT_REASONS)[]]),
  note: z.string().max(500).optional(),
})
