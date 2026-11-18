import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cocktailFieldsFromForm, cocktailSchema } from './validators/cocktail.ts'
import { fieldErrors, firstIssue } from './validators/issues.ts'

const fd = (fields: Record<string, string | string[]>) => {
  const data = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    for (const one of Array.isArray(v) ? v : [v]) data.append(k, one)
  }
  return data
}

const valid = {
  name: 'Mojito',
  description: 'Classic lime and mint serve.',
  ingredientAmount: ['50ml', '1'],
  ingredientItem: ['White rum', 'Lime'],
  method: 'Muddle the mint, then shake and top with soda.',
}

describe('cocktailFieldsFromForm', () => {
  it('accepts a complete drink', () => {
    const parsed = cocktailFieldsFromForm(fd(valid))
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.name, 'Mojito')
      assert.equal(parsed.data.ingredients.length, 2)
    }
  })

  it('rejects a method shorter than 10 characters after trim', () => {
    const parsed = cocktailFieldsFromForm(fd({ ...valid, method: 'shake it' }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(firstIssue(parsed.error.issues), 'Method: At least 10 characters')
      assert.equal(fieldErrors(parsed.error.issues).method, 'At least 10 characters')
    }
  })

  it('counts length after trim, so padded short methods still fail', () => {
    const parsed = cocktailFieldsFromForm(fd({ ...valid, method: '  shake it  ' }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(fieldErrors(parsed.error.issues).method, 'At least 10 characters')
    }
  })

  it('accepts a method that is exactly 10 characters once trimmed', () => {
    const parsed = cocktailFieldsFromForm(fd({ ...valid, method: '  1234567890  ' }))
    assert.equal(parsed.success, true)
  })

  it('rejects a short name and description with the same hint wording', () => {
    const parsed = cocktailFieldsFromForm(fd({ ...valid, name: 'A', description: 'Too short' }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      const fields = fieldErrors(parsed.error.issues)
      assert.equal(fields.name, 'At least 2 characters')
      assert.equal(fields.description, 'At least 10 characters')
      assert.equal(firstIssue(parsed.error.issues), 'Drink name: At least 2 characters')
    }
  })

  it('rejects a drink with no ingredients', () => {
    const parsed = cocktailFieldsFromForm(fd({
      name: valid.name,
      description: valid.description,
      method: valid.method,
    }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(fieldErrors(parsed.error.issues).ingredients, 'Add at least one ingredient')
    }
  })
})

describe('cocktailSchema method length', () => {
  const base = { name: 'Mojito', description: 'Classic lime and mint serve.', ingredients: [{ amount: '50ml', item: 'Rum' }], isAlcoholFree: false }
  it('fails at 9 characters and passes at 10', () => {
    assert.equal(cocktailSchema.safeParse({ ...base, method: '123456789' }).success, false)
    assert.equal(cocktailSchema.safeParse({ ...base, method: '1234567890' }).success, true)
  })
})
