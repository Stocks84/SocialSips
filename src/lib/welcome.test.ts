import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  WELCOME_AFTER,
  WELCOME_LINKS,
  WELCOME_FRIEND_LINE,
  WELCOME_PROFILE_LINK,
  isProfileUnfinished,
  isWelcomeColumnMissing,
  shouldShowWelcome,
} from './welcome.ts'

const after = '2026-11-18T12:00:00.000Z'
const before = '2026-11-17T23:59:59.000Z'
const now = Date.parse('2026-11-18T18:00:00.000Z')

describe('shouldShowWelcome', () => {
  it('shows for an account created on or after the cutoff, and not once dismissed', () => {
    assert.equal(shouldShowWelcome({ createdAt: WELCOME_AFTER, now }), true)
    assert.equal(shouldShowWelcome({ createdAt: after, now }), true)
    assert.equal(shouldShowWelcome({ createdAt: after, dismissed: true, now }), false)
  })

  it('does not show for existing accounts, missing dates, or junk dates', () => {
    assert.equal(shouldShowWelcome({ createdAt: before, now }), false)
    assert.equal(shouldShowWelcome({ createdAt: null, now }), false)
    assert.equal(shouldShowWelcome({ createdAt: undefined, now }), false)
    assert.equal(shouldShowWelcome({ createdAt: 'not-a-date', now }), false)
  })
})

describe('isProfileUnfinished', () => {
  it('is true only when display name, bio and photo are all blank', () => {
    assert.equal(isProfileUnfinished({}), true)
    assert.equal(isProfileUnfinished({ display_name: null, bio: '  ', avatar_url: null }), true)
    assert.equal(isProfileUnfinished({ display_name: 'Sam' }), false)
    assert.equal(isProfileUnfinished({ bio: 'Gin fan' }), false)
    assert.equal(isProfileUnfinished({ avatar_url: 'https://example.com/a.jpg' }), false)
  })
})

describe('welcome copy', () => {
  it('uses Drinks and Dares, never Cocktails or Challenge, in visible labels', () => {
    const labels = [...WELCOME_LINKS.map((l) => l.label), WELCOME_PROFILE_LINK.label].join(' ')
    assert.match(labels, /Games/)
    assert.match(labels, /drink/i)
    assert.match(labels, /Dare/)
    assert.doesNotMatch(labels, /cocktail/i)
    assert.doesNotMatch(labels, /challenge/i)
  })

  it('points invited friends to a shared profile link, not search or suggestions', () => {
    assert.match(WELCOME_FRIEND_LINE, /profile link/i)
    assert.match(WELCOME_FRIEND_LINE, /Follow/)
    assert.match(WELCOME_FRIEND_LINE, /Share/)
    assert.doesNotMatch(WELCOME_FRIEND_LINE, /search/i)
    assert.doesNotMatch(WELCOME_FRIEND_LINE, /suggest/i)
    assert.doesNotMatch(WELCOME_FRIEND_LINE, /people you may know/i)
    assert.doesNotMatch(WELCOME_FRIEND_LINE, /cocktail/i)
    assert.doesNotMatch(WELCOME_FRIEND_LINE, /challenge/i)
  })
})

describe('isWelcomeColumnMissing', () => {
  it('recognises a missing welcome_dismissed_at column during the deploy window', () => {
    assert.equal(isWelcomeColumnMissing({ code: '42703', message: 'column "welcome_dismissed_at" does not exist' }), true)
    assert.equal(isWelcomeColumnMissing({ code: 'PGRST204', message: 'Could not find the welcome_dismissed_at column in the schema cache' }), true)
    assert.equal(isWelcomeColumnMissing({ code: '42703' }), true)
    assert.equal(isWelcomeColumnMissing({ message: 'column profiles.welcome_dismissed_at does not exist' }), true)
  })

  it('does not swallow unrelated errors', () => {
    assert.equal(isWelcomeColumnMissing(null), false)
    assert.equal(isWelcomeColumnMissing({ code: '42501', message: 'permission denied' }), false)
    assert.equal(isWelcomeColumnMissing({ message: 'jwt expired' }), false)
  })
})
