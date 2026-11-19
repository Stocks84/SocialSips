import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { absoluteShareUrl } from './share-url.ts'

describe('absoluteShareUrl', () => {
  it('joins a path to the given origin', () => {
    assert.equal(absoluteShareUrl('/games/abc', 'https://social-sips.app'), 'https://social-sips.app/games/abc')
  })
  it('adds a leading slash if missing', () => {
    assert.equal(absoluteShareUrl('challenge', 'https://social-sips.app'), 'https://social-sips.app/challenge')
  })
})
