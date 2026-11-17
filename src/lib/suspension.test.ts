import test from 'node:test'
import assert from 'node:assert/strict'
import { reportControl, suspendedBlockCopy, suspendedNoteCopy } from './suspension.ts'

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

test('note copy is one line naming the action; reason trimmed or null', () => {
  const n = suspendedNoteCopy('comment', ' spam ')
  assert.match(n.text, /suspended, so you can’t comment right now/)
  assert.equal(n.reason, 'spam')
  assert.equal(suspendedNoteCopy('vote', '').reason, null)
  assert.equal(suspendedNoteCopy('vote', null).reason, null)
})

test('report control: signed-out gets the public link, unchanged', () => {
  assert.equal(reportControl({ signedIn: false, suspended: false }), 'public')
  assert.equal(reportControl({ signedIn: false, suspended: true }), 'public')
})

test('report control: signed-in gets the button, suspended gets nothing', () => {
  assert.equal(reportControl({ signedIn: true, suspended: false }), 'button')
  assert.equal(reportControl({ signedIn: true, suspended: true }), 'none')
})
