import test from 'node:test'
import assert from 'node:assert/strict'
import { reactionTarget, settleReaction } from './memes.ts'

test('tapping a new reaction sets it; tapping your own removes it', () => {
  assert.equal(reactionTarget(null, '🔥'), '🔥')
  assert.equal(reactionTarget('😂', '🔥'), '🔥')
  assert.equal(reactionTarget('🔥', '🔥'), null)
})

test('a rejected reply shows the error and no counts, so nothing wrong is displayed', () => {
  const r = settleReaction({ error: 'suspended' }, false)
  assert.deepEqual(r, { ignore: false, error: 'suspended', view: null })
})

test('a good reply swaps in the server counts', () => {
  const r = settleReaction({ counts: { '🔥': 3 }, mine: '🔥' }, false)
  assert.deepEqual(r, { ignore: false, error: null, view: { counts: { '🔥': 3 }, mine: '🔥' } })
})

test('a good reply with no mine clears it; missing counts become empty', () => {
  assert.deepEqual(settleReaction({}, false), { ignore: false, error: null, view: { counts: {}, mine: null } })
})

test('replies to older taps are ignored, even errors', () => {
  assert.deepEqual(settleReaction({ error: 'x' }, true), { ignore: true })
  assert.deepEqual(settleReaction({ counts: { '🔥': 9 }, mine: '🔥' }, true), { ignore: true })
})
