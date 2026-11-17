import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildShareMetadata, challengeCardText, challengePageMetadata, NOT_FOUND_META, snippet } from './share-meta.ts'

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

describe('challengePageMetadata (/challenge share card)', () => {
  const c = { theme: 'Worst pickup line', description: 'Funniest wins', kindLabel: 'Meme', week: '16 Nov – 22 Nov' }
  const m = challengePageMetadata('https://x.test', c)
  it("uses this week's theme and description, the /challenge canonical and the /challenge/og image", () => {
    assert.equal(m.title, "Worst pickup line · This week's dare")
    assert.equal(m.description, 'Funniest wins')
    assert.equal(m.alternates?.canonical, 'https://x.test/challenge')
    const og = m.openGraph as { url: string; type: string; images: { url: string; width: number; height: number }[] }
    assert.equal(og.url, 'https://x.test/challenge')
    assert.equal(og.type, 'website')
    assert.deepEqual([og.images[0].url, og.images[0].width, og.images[0].height], ['https://x.test/challenge/og', 1200, 630])
    const tw = m.twitter as { card: string; images: string[] }
    assert.equal(tw.card, 'summary_large_image')
    assert.deepEqual(tw.images, ['https://x.test/challenge/og'])
  })
  it('falls back to a generated description when the challenge has none, and trims long text', () => {
    assert.match(String(challengePageMetadata('https://x.test', { ...c, description: null }).description), /^Meme dare, 16 Nov – 22 Nov\. Enter and vote on Social Sips\. 18\+ only\.$/)
    assert.ok(String(challengePageMetadata('https://x.test', { ...c, theme: 'x'.repeat(200), description: 'y'.repeat(500) }).description).length <= 160)
  })
  it('no active challenge gives a sensible default (still with the image)', () => {
    const d = challengePageMetadata('https://x.test', null)
    assert.equal(d.title, 'Weekly dare')
    assert.match(String(d.description), /new Social Sips dare every week/)
    assert.equal((d.openGraph as { images: { url: string }[] }).images[0].url, 'https://x.test/challenge/og')
  })
})

describe('challengeCardText', () => {
  it('shows theme, description and kind/week for a challenge', () => {
    const t = challengeCardText({ theme: 'T', description: 'D', kindLabel: 'Cocktail variation', week: '16 Nov – 22 Nov' })
    assert.equal(t.title, 'T'); assert.equal(t.body, 'D'); assert.match(t.footer, /^Cocktail variation · 16 Nov – 22 Nov · 18\+$/)
  })
  it('has a generic card when none is active', () => {
    const t = challengeCardText(null)
    assert.equal(t.kicker, 'Weekly dare'); assert.ok(t.title.length > 0)
  })
})
