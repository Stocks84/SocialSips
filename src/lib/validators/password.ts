import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

export const updatePasswordSchema = z.object({
  password: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
