import { z } from 'zod'
import { isOfAge } from '@/lib/age'

export const dobSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
  .refine(isOfAge, 'You must be 18 or over to use Social Sips')

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
  username: z.string().regex(/^[a-z0-9_]{3,20}$/, '3–20 lowercase letters, numbers or _'),
  dateOfBirth: dobSchema,
})

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type SignUpInput = z.infer<typeof signUpSchema>
