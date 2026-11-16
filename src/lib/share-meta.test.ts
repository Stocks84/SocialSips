import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildShareMetadata, NOT_FOUND_META, snippet } from './share-meta.ts'

describe('snippet', () => {
  it('collapses whitespace and truncates with an ellipsis', () => {
    assert.equal(snippet('  a \n  b  ', 10), 'a b')
    assert.equal(snippet('abcdefghij', 5), 'abcd…')
    assert.equal(snippet(null, 5), '')
  })
})

describe('buildShareMetadata', () => {
  const m = buildShareMetadata({ origin: 'https://x.test', path: '/games/1', title: 'T', description: 'D', image: 'https://x.test/games/1/og' })
  it('sets canonical, og:url and og:type from the trusted origin', () => {
    assert.equal(m.alternates?.canonical, 'https://x.test/games/1')
    const og = m.openGraph as { url: string; type: string; images: { url: string }[] }
    assert.equal(og.url, 'https://x.test/games/1')
    assert.equal(og.type, 'article')
    assert.equal(og.images[0].url, 'https://x.test/games/1/og')
  })
  it('uses a large Twitter card with the same image', () => {
    const tw = m.twitter as { card: string; images: string[] }
    assert.equal(tw.card, 'summary_large_image')
    assert.deepEqual(tw.images, ['https://x.test/games/1/og'])
  })
})

describe('NOT_FOUND_META', () => {
  it('is generic and not indexable', () => {
    assert.deepEqual(NOT_FOUND_META.robots, { index: false })
    assert.equal(NOT_FOUND_META.openGraph, undefined)
  })
})
