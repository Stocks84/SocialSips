import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { forgotPasswordSchema, updatePasswordSchema } from './validators/password.ts'

describe('forgotPasswordSchema', () => {
  it('accepts a valid email and rejects a blank or invalid one', () => {
    assert.equal(forgotPasswordSchema.safeParse({ email: 'will@example.com' }).success, true)
    assert.equal(forgotPasswordSchema.safeParse({ email: '' }).success, false)
    assert.equal(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success, false)
  })
})

describe('updatePasswordSchema', () => {
  it('requires at least 8 characters, matching sign-up', () => {
    assert.equal(updatePasswordSchema.safeParse({ password: '1234567', confirm: '1234567' }).success, false)
    assert.equal(updatePasswordSchema.safeParse({ password: '12345678', confirm: '12345678' }).success, true)
  })

  it('rejects a confirm field that does not match', () => {
    const parsed = updatePasswordSchema.safeParse({ password: '12345678', confirm: '87654321' })
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(parsed.error.issues[0]?.message, 'Passwords do not match')
    }
  })
})
