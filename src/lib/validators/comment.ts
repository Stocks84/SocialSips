import { z } from 'zod'

export const commentSchema = z.object({ body: z.string().min(1).max(1000) })
export const ratingSchema = z.object({ score: z.coerce.number().int().min(1).max(5) })

export const REPORT_REASONS = {
  illegal: 'Illegal content',
  underage: 'Involves under-18s',
  copyright: 'Copyright or someone else\u2019s photo',
  spam: 'Spam or advertising',
  harassment: 'Harassment or bullying',
  dangerous: 'Dangerous drinking / unsafe',
  hate: 'Hate speech',
  other: 'Something else',
} as const

export const reportSchema = z.object({
  targetType: z.enum(['game', 'comment', 'variation', 'cocktail', 'cocktail_variation', 'meme']),
  targetId: z.string().uuid(),
  reason: z.enum(Object.keys(REPORT_REASONS) as [keyof typeof REPORT_REASONS, ...(keyof typeof REPORT_REASONS)[]]),
  note: z.string().max(500).optional(),
})

export const REPORT_TARGETS = ['game', 'comment', 'variation', 'cocktail', 'cocktail_variation', 'meme'] as const
type Reason = keyof typeof REPORT_REASONS
const REASON_KEYS = Object.keys(REPORT_REASONS) as [Reason, ...Reason[]]

/** Public /report form (signed in or not). Either an exact item (type + id) or a link. */
export const publicReportSchema = z.object({
  targetType: z.enum(REPORT_TARGETS).optional(),
  targetId: z.string().uuid().optional(),
  url: z.string().trim().max(500).optional(),
  reason: z.enum(REASON_KEYS, 'Pick a reason'),
  note: z.string().trim().min(10, 'Tell us what’s wrong (at least 10 characters)').max(500),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email or leave it empty').max(254)]).optional(),
  goodFaith: z.literal(true, 'Please confirm the statement'),
}).refine((r) => (r.targetType && r.targetId) || r.url, { message: 'Add a link to the content', path: ['url'] })
