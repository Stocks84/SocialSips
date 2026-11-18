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

/** Read and trim the drink form fields, then validate with cocktailSchema (shared by the server action and the form). */
export function cocktailFieldsFromForm(formData: FormData) {
  const amounts = formData.getAll('ingredientAmount').map(String)
  const items = formData.getAll('ingredientItem').map(String)
  const ingredients = items
    .map((item, i) => ({ item: item.trim(), amount: (amounts[i] ?? '').trim() }))
    .filter((x) => x.item)
  return cocktailSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    ingredients,
    method: String(formData.get('method') ?? '').trim(),
    isAlcoholFree: formData.get('isAlcoholFree') === 'true',
  })
}
