import { z } from 'zod'

export const cocktailSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(300),
  ingredients: z.array(z.object({ amount: z.string().max(40), item: z.string().min(1).max(80) })).min(1, 'Add at least one ingredient').max(20),
  method: z.string().min(10).max(3000),
  isAlcoholFree: z.boolean(),
})

export const memeSchema = z.object({
  caption: z.string().max(200).optional(),
  jokeText: z.string().max(500).optional(),
})
