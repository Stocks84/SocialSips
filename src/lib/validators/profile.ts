import { z } from 'zod'

// Limits match the DB checks (profiles_display_name_len, profiles_bio_check).
export const PROFILE_LIMITS = { displayName: 50, bio: 280 } as const

const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim()

export const profileSchema = z.object({
  displayName: z.string().transform((s) => clean(s).replace(/\s+/g, ' ')).pipe(z.string().max(PROFILE_LIMITS.displayName)),
  bio: z.string().transform(clean).pipe(z.string().max(PROFILE_LIMITS.bio)),
})
