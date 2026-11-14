import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { encodeCursor, newestFirst, parseCursor, rpcPage, type Cursor } from './paging.ts'

const at = '2026-11-13T12:34:56.123456Z'
const id = '01234567-89ab-cdef-0123-456789abcdef'
const cursor: Cursor = { at, id }

describe('parseCursor / encodeCursor', () => {
  it('round-trips a valid cursor', () => {
    assert.deepEqual(parseCursor(encodeCursor(cursor)), cursor)
  })
  it('accepts offsets and shorter fractional seconds', () => {
    assert.deepEqual(parseCursor('2026-11-13T12:34:56+00:00_01234567-89ab-cdef-0123-456789abcdef')?.id, id)
    assert.ok(parseCursor('2026-11-13T12:34:56.1Z_' + id))
  })
  it('ignores missing, malformed, or truncated values', () => {
    assert.equal(parseCursor(undefined), null)
    assert.equal(parseCursor(''), null)
    assert.equal(parseCursor('not-a-cursor'), null)
    assert.equal(parseCursor(at), null)
    assert.equal(parseCursor(at + '_not-a-uuid'), null)
    assert.equal(parseCursor('2026-11-13 12:34:56Z_' + id), null)
  })
})

describe('newestFirst', () => {
  const a: Cursor = { at: '2026-11-13T12:00:00Z', id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }
  const b: Cursor = { at: '2026-11-13T11:00:00Z', id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }
  const c: Cursor = { at: '2026-11-13T12:00:00Z', id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }
  it('orders later timestamps first, and ties by id descending', () => {
    const rows = [b, c, a].sort(newestFirst)
    assert.deepEqual(rows.map((r) => r.id), [c.id, a.id, b.id])
  })
})

describe('rpcPage', () => {
  it('sends only max_rows on the first newest page, so pre-0032 RPCs still work', () => {
    assert.deepEqual(rpcPage({ limit: 21 }), { max_rows: 21 })
    assert.deepEqual(rpcPage({ limit: 21, before: null, offset: 0, top: false }), { max_rows: 21 })
  })
  it('adds the keyset cursor on later newest pages', () => {
    assert.deepEqual(rpcPage({ limit: 21, before: cursor }), { max_rows: 21, before_at: at, before_id: id })
  })
  it('uses row_offset for top sort and ignores a leftover cursor', () => {
    assert.deepEqual(rpcPage({ limit: 21, offset: 0, top: true, before: cursor }), { max_rows: 21 })
    assert.deepEqual(rpcPage({ limit: 21, offset: 20, top: true, before: cursor }), { max_rows: 21, row_offset: 20 })
  })
})
