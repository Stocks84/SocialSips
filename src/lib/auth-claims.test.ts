import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { userIdFromClaims, usernameFromClaims } from './auth-claims.ts'

describe('usernameFromClaims', () => {
  it('reads username from user_metadata, trimmed', () => {
    assert.equal(usernameFromClaims({ sub: 'abc', user_metadata: { username: '  sam  ' } }), 'sam')
  })
  it('falls back to a top-level username claim', () => {
    assert.equal(usernameFromClaims({ username: 'sam' }), 'sam')
  })
  it('returns null for missing, blank, or non-string values', () => {
    assert.equal(usernameFromClaims(null), null)
    assert.equal(usernameFromClaims({}), null)
    assert.equal(usernameFromClaims({ user_metadata: { username: '' } }), null)
    assert.equal(usernameFromClaims({ user_metadata: { username: 1 } }), null)
  })
})

describe('userIdFromClaims', () => {
  it('reads sub, or null when it is missing', () => {
    assert.equal(userIdFromClaims({ sub: 'abc' }), 'abc')
    assert.equal(userIdFromClaims({}), null)
    assert.equal(userIdFromClaims(null), null)
  })
})
