import test from 'node:test'
import assert from 'node:assert/strict'
import { suspendedBlockCopy } from './suspension.ts'

test('block copy names the action and says suspended', () => {
  const c = suspendedBlockCopy('add a game', null)
  assert.equal(c.heading, 'Your account is suspended')
  assert.match(c.body, /can’t add a game/)
  assert.equal(c.reason, null)
})

test('reason is trimmed; blank or missing reason gives null', () => {
  assert.equal(suspendedBlockCopy('post a meme', '  spam  ').reason, 'spam')
  assert.equal(suspendedBlockCopy('post a meme', '   ').reason, null)
  assert.equal(suspendedBlockCopy('post a meme', undefined).reason, null)
})
