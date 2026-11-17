import test from 'node:test'
import assert from 'node:assert/strict'
import { adminMetadata, profileMetadata, titleIfFound } from './share-meta.ts'

test('admins get the admin title and noindex', () => {
  assert.deepEqual(adminMetadata('Accounts · Admin', true), { title: 'Accounts · Admin', robots: { index: false } })
})

test('non-admins get no metadata at all (so the normal 404 title shows)', () => {
  assert.deepEqual(adminMetadata('Accounts · Admin', false), {})
})

test('profile title prefers the display name, then @username', () => {
  assert.equal(profileMetadata({ username: 'sam', display_name: 'Sam P', bio: null }).title, 'Sam P')
  assert.equal(profileMetadata({ username: 'sam', display_name: null, bio: null }).title, '@sam')
  assert.equal(profileMetadata({ username: 'sam', display_name: '   ', bio: null }).title, '@sam')
})

test('profile description uses a trimmed bio, else a generic line', () => {
  assert.equal(profileMetadata({ username: 'sam', display_name: null, bio: 'Gin\n  fan' }).description, 'Gin fan')
  assert.match(String(profileMetadata({ username: 'sam', display_name: 'Sam', bio: '' }).description), /shared by Sam on Social Sips/)
  const long = profileMetadata({ username: 'sam', display_name: null, bio: 'x'.repeat(500) }).description as string
  assert.ok(long.length <= 160)
})

test('unknown profile gets no metadata (normal 404 title)', () => {
  assert.deepEqual(profileMetadata(null), {})
})

test('only title and description come out, even if a private field is passed in', () => {
  const sneaky = { username: 'sam', display_name: 'Sam', bio: null, date_of_birth: '1990-01-01', id: 'uuid-1' } as never
  const out = profileMetadata(sneaky)
  assert.deepEqual(Object.keys(out).sort(), ['description', 'title'])
  assert.ok(!JSON.stringify(out).includes('1990'))
  assert.ok(!JSON.stringify(out).includes('uuid-1'))
})

test('titleIfFound only titles pages whose profile exists', () => {
  assert.deepEqual(titleIfFound('Followers', true), { title: 'Followers' })
  assert.deepEqual(titleIfFound('Followers', false), {})
})
