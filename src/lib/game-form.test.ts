import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameFieldsFromForm, gameSchema } from './validators/game.ts'
import { fieldErrors, firstIssue } from './validators/issues.ts'

const fd = (fields: Record<string, string | string[]>) => {
  const data = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    for (const one of Array.isArray(v) ? v : [v]) data.append(k, one)
  }
  return data
}

const valid = {
  title: 'Kings Cup',
  summary: 'Draw cards, follow the rules.',
  rules: 'Each card has a rule. The last king prepares the cup.',
  equipment: 'deck of cards, large cup',
  minPlayers: '2',
  maxPlayers: '12',
  hangoverRating: 'mild_hangover',
  tags: 'Cards, Party',
}

describe('gameFieldsFromForm', () => {
  it('accepts a complete game and lowercases tags', () => {
    const parsed = gameFieldsFromForm(fd(valid))
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.title, 'Kings Cup')
      assert.deepEqual(parsed.data.equipment, ['deck of cards', 'large cup'])
      assert.deepEqual(parsed.data.tags, ['cards', 'party'])
      assert.equal(parsed.data.minPlayers, 2)
      assert.equal(parsed.data.maxPlayers, 12)
    }
  })

  it('rejects rules shorter than 20 characters after trim', () => {
    const parsed = gameFieldsFromForm(fd({ ...valid, rules: 'Draw a card.' }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(firstIssue(parsed.error.issues), 'Rules: At least 20 characters')
      assert.equal(fieldErrors(parsed.error.issues).rules, 'At least 20 characters')
    }
  })

  it('counts length after trim, so padded short rules still fail', () => {
    const parsed = gameFieldsFromForm(fd({ ...valid, rules: '  Draw a card.  ' }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(fieldErrors(parsed.error.issues).rules, 'At least 20 characters')
    }
  })

  it('accepts rules that are exactly 20 characters once trimmed', () => {
    const parsed = gameFieldsFromForm(fd({ ...valid, rules: '  12345678901234567890  ' }))
    assert.equal(parsed.success, true)
  })

  it('rejects a short title and summary with the same hint wording', () => {
    const parsed = gameFieldsFromForm(fd({ ...valid, title: 'Go', summary: 'Too short' }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      const fields = fieldErrors(parsed.error.issues)
      assert.equal(fields.title, 'At least 3 characters')
      assert.equal(fields.summary, 'At least 10 characters')
      assert.equal(firstIssue(parsed.error.issues), 'Title: At least 3 characters')
    }
  })

  it('rejects a max player count below the min', () => {
    const parsed = gameFieldsFromForm(fd({ ...valid, minPlayers: '4', maxPlayers: '2' }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(fieldErrors(parsed.error.issues).maxPlayers, 'Max players must be at least min players')
    }
  })

  it('allows a blank max player count', () => {
    const parsed = gameFieldsFromForm(fd({ ...valid, maxPlayers: '' }))
    assert.equal(parsed.success, true)
    if (parsed.success) assert.equal(parsed.data.maxPlayers, undefined)
  })
})

describe('gameSchema rules length', () => {
  const base = {
    title: 'Kings Cup',
    summary: 'Draw cards, follow the rules.',
    equipment: ['cards'],
    minPlayers: 2,
    hangoverRating: 'mild_hangover' as const,
    tags: ['cards'],
  }
  it('fails at 19 characters and passes at 20', () => {
    assert.equal(gameSchema.safeParse({ ...base, rules: '1234567890123456789' }).success, false)
    assert.equal(gameSchema.safeParse({ ...base, rules: '12345678901234567890' }).success, true)
  })
})

describe('gameFieldsFromForm list limits', () => {
  const eleven = Array.from({ length: 11 }, (_, i) => `item${i + 1}`).join(', ')
  const ten = Array.from({ length: 10 }, (_, i) => `item${i + 1}`).join(', ')

  it('rejects more than 10 equipment items and does not drop the extras', () => {
    const parsed = gameFieldsFromForm(fd({ ...valid, equipment: eleven }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(fieldErrors(parsed.error.issues).equipment, 'Up to 10 items')
      assert.equal(firstIssue(parsed.error.issues), 'Equipment: Up to 10 items')
    }
  })

  it('rejects more than 10 tags and does not drop the extras', () => {
    const parsed = gameFieldsFromForm(fd({ ...valid, tags: eleven }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(fieldErrors(parsed.error.issues).tags, 'Up to 10 items')
      assert.equal(firstIssue(parsed.error.issues), 'Tags: Up to 10 items')
    }
  })

  it('accepts exactly 10 equipment items and 10 tags', () => {
    const parsed = gameFieldsFromForm(fd({ ...valid, equipment: ten, tags: ten }))
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.equipment.length, 10)
      assert.equal(parsed.data.tags.length, 10)
    }
  })

  it('rejects an equipment item longer than 60 characters', () => {
    const long = 'a'.repeat(61)
    const parsed = gameFieldsFromForm(fd({ ...valid, equipment: long }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(fieldErrors(parsed.error.issues).equipment, 'Each item up to 60 characters')
      assert.equal(firstIssue(parsed.error.issues), 'Equipment: Each item up to 60 characters')
    }
  })

  it('rejects a tag longer than 40 characters', () => {
    const long = 'a'.repeat(41)
    const parsed = gameFieldsFromForm(fd({ ...valid, tags: long }))
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(fieldErrors(parsed.error.issues).tags, 'Each item up to 40 characters')
      assert.equal(firstIssue(parsed.error.issues), 'Tags: Each item up to 40 characters')
    }
  })

  it('accepts equipment and tags at the per-item length limit', () => {
    const parsed = gameFieldsFromForm(fd({
      ...valid,
      equipment: 'a'.repeat(60),
      tags: 'b'.repeat(40),
    }))
    assert.equal(parsed.success, true)
  })
})
