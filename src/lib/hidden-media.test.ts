import test from 'node:test'
import assert from 'node:assert/strict'
import { hiddenObjectName, imagePathFromUrl, isMissingObject, HIDDEN_BUCKET } from './hidden-media.ts'

const BASE = 'https://abc.supabase.co/storage/v1/object/public'
const U = '11111111-2222-3333-4444-555555555555'

test('hidden object name keeps the original bucket and path', () => {
  assert.equal(hiddenObjectName('memes', `${U}/a.jpg`), `memes/${U}/a.jpg`)
  assert.equal(HIDDEN_BUCKET, 'hidden-media')
})

test('hidden name round-trips: strip the bucket prefix to get the public path back', () => {
  const path = imagePathFromUrl(`${BASE}/game-covers/${U}/c.webp`, 'game-covers')
  assert.equal(path, `${U}/c.webp`)
  const hidden = hiddenObjectName('game-covers', path!)
  assert.equal(hidden.slice('game-covers/'.length), path)
})

test('imagePathFromUrl: no image, other bucket, other host and traversal give null', () => {
  assert.equal(imagePathFromUrl(null, 'memes'), null)
  assert.equal(imagePathFromUrl('', 'memes'), null)
  assert.equal(imagePathFromUrl(`${BASE}/avatars/${U}/a.jpg`, 'memes'), null)
  assert.equal(imagePathFromUrl('https://example.com/pic.jpg', 'memes'), null)
  assert.equal(imagePathFromUrl(`${BASE}/memes/`, 'memes'), null)
  assert.equal(imagePathFromUrl(`${BASE}/memes/${U}/..%2F..%2Fx.jpg`, 'memes'), null)
})

test('imagePathFromUrl decodes encoded names', () => {
  assert.equal(imagePathFromUrl(`${BASE}/memes/${U}/my%20pic.png`, 'memes'), `${U}/my pic.png`)
})

test('isMissingObject recognises Storage "not found" shapes only', () => {
  assert.equal(isMissingObject({ message: 'Object not found', statusCode: '404' }), true)
  assert.equal(isMissingObject({ message: 'The resource was not found' }), true)
  assert.equal(isMissingObject({ message: 'x', status: 404 }), true)
  assert.equal(isMissingObject({ message: 'new row violates row-level security policy', statusCode: '403' }), false)
  assert.equal(isMissingObject({ message: 'Access denied' }), false)
  assert.equal(isMissingObject(null), false)
})
