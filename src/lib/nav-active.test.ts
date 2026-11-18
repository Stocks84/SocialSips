import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isNavActive, navHrefsForActive } from './nav-active.ts'

const hrefs = navHrefsForActive(['/feed', '/games', '/cocktails', '/games/new', '/memes', '/play', '/challenge'])

describe('isNavActive', () => {
  it('treats /games/new and /cocktails/new as Add, not Games or Drinks', () => {
    assert.equal(isNavActive('/games/new', '/games/new', hrefs), true)
    assert.equal(isNavActive('/cocktails/new', '/games/new', hrefs), true)
    assert.equal(isNavActive('/games/new', '/games', hrefs), false)
    assert.equal(isNavActive('/cocktails/new', '/cocktails', hrefs), false)
  })

  it('keeps list and detail pages on their own tabs', () => {
    assert.equal(isNavActive('/games', '/games', hrefs), true)
    assert.equal(isNavActive('/games/abc', '/games', hrefs), true)
    assert.equal(isNavActive('/cocktails', '/cocktails', hrefs), true)
    assert.equal(isNavActive('/cocktails/abc', '/cocktails', hrefs), true)
    assert.equal(isNavActive('/games', '/games/new', hrefs), false)
    assert.equal(isNavActive('/cocktails', '/games/new', hrefs), false)
  })

  it('does not highlight Feed on other tab routes', () => {
    assert.equal(isNavActive('/games', '/feed', hrefs), false)
    assert.equal(isNavActive('/feed', '/feed', hrefs), true)
  })
})

describe('navHrefsForActive', () => {
  it('adds /cocktails/new when the Add item is present', () => {
    assert.deepEqual(navHrefsForActive(['/games', '/games/new']), ['/games', '/games/new', '/cocktails/new'])
    assert.deepEqual(navHrefsForActive(['/games', '/feed']), ['/games', '/feed'])
  })
})
