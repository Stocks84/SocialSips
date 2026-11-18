import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  commentAnchorId, commentBelongsToPage, commentHref, commentPermalink,
  parseReportUrl, reportTargetFromParsed,
} from './report-url.ts'

const GAME = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const COMMENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const HOST = 'social-sips-livid.vercel.app'
const pageComment = {
  id: COMMENT,
  game_id: GAME,
  cocktail_id: null as string | null,
  meme_id: null as string | null,
  is_hidden: false,
}

describe('comment permalink helpers', () => {
  it('builds a stable #comment-<id> anchor and path', () => {
    assert.equal(commentAnchorId(COMMENT), `comment-${COMMENT}`)
    assert.equal(commentPermalink(`/games/${GAME}`, COMMENT), `/games/${GAME}#comment-${COMMENT}`)
  })

  it('links a comment to its parent game, drink or meme', () => {
    assert.equal(commentHref(pageComment, COMMENT), `/games/${GAME}#comment-${COMMENT}`)
    assert.equal(
      commentHref({ game_id: null, cocktail_id: GAME, meme_id: null }, COMMENT),
      `/cocktails/${GAME}#comment-${COMMENT}`,
    )
    assert.equal(
      commentHref({ game_id: null, cocktail_id: null, meme_id: GAME }, COMMENT),
      `/memes/${GAME}#comment-${COMMENT}`,
    )
    assert.equal(commentHref({ game_id: null, cocktail_id: null, meme_id: null }, COMMENT), null)
  })
})

describe('parseReportUrl', () => {
  it('reads a game, drink or meme page with no comment', () => {
    assert.deepEqual(parseReportUrl(`https://${HOST}/games/${GAME}`, HOST), { page: { type: 'game', id: GAME }, commentId: null })
    assert.deepEqual(parseReportUrl(`https://${HOST}/cocktails/${GAME}/`, HOST), { page: { type: 'cocktail', id: GAME }, commentId: null })
    assert.deepEqual(parseReportUrl(`https://${HOST}/memes/${GAME}`, HOST), { page: { type: 'meme', id: GAME }, commentId: null })
  })

  it('reads #comment-<id> and ?comment=<id>, lowercasing ids', () => {
    const upperGame = GAME.toUpperCase()
    const upperComment = COMMENT.toUpperCase()
    assert.deepEqual(
      parseReportUrl(`https://${HOST}/games/${upperGame}#comment-${upperComment}`, HOST),
      { page: { type: 'game', id: GAME }, commentId: COMMENT },
    )
    assert.deepEqual(
      parseReportUrl(`https://${HOST}/cocktails/${GAME}?comment=${COMMENT}`, HOST),
      { page: { type: 'cocktail', id: GAME }, commentId: COMMENT },
    )
    assert.deepEqual(
      parseReportUrl(`https://${HOST}/memes/${GAME}?foo=1&comment=${COMMENT}#section`, HOST),
      { page: { type: 'meme', id: GAME }, commentId: COMMENT },
    )
  })

  it('prefers the hash when both a hash and ?comment= are present', () => {
    const other = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    assert.deepEqual(
      parseReportUrl(`https://${HOST}/games/${GAME}?comment=${other}#comment-${COMMENT}`, HOST),
      { page: { type: 'game', id: GAME }, commentId: COMMENT },
    )
  })

  it('accepts a relative path against the given host', () => {
    assert.deepEqual(
      parseReportUrl(`/games/${GAME}#comment-${COMMENT}`, HOST),
      { page: { type: 'game', id: GAME }, commentId: COMMENT },
    )
  })

  it('returns null for a different host, a non-content path, or junk', () => {
    assert.equal(parseReportUrl(`https://evil.example/games/${GAME}#comment-${COMMENT}`, HOST), null)
    assert.equal(parseReportUrl(`https://${HOST}/help`, HOST), null)
    assert.equal(parseReportUrl(`https://${HOST}/games/${GAME}#comment-not-a-uuid`, HOST)?.commentId, null)
    assert.equal(parseReportUrl('not a url', HOST), null)
    assert.equal(parseReportUrl('', HOST), null)
  })
})

describe('reportTargetFromParsed', () => {
  it('stores a visible comment that belongs to the page', () => {
    const parsed = parseReportUrl(`https://${HOST}/games/${GAME}#comment-${COMMENT}`, HOST)
    assert.deepEqual(reportTargetFromParsed(parsed, pageComment), { type: 'comment', id: COMMENT })
  })

  it('falls back to the page when the comment is hidden, missing, or on another post', () => {
    const parsed = parseReportUrl(`https://${HOST}/games/${GAME}#comment-${COMMENT}`, HOST)
    assert.deepEqual(reportTargetFromParsed(parsed, null), { type: 'game', id: GAME })
    assert.deepEqual(
      reportTargetFromParsed(parsed, { ...pageComment, is_hidden: true }),
      { type: 'game', id: GAME },
    )
    assert.deepEqual(
      reportTargetFromParsed(parsed, { ...pageComment, game_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' }),
      { type: 'game', id: GAME },
    )
  })

  it('does not treat a hidden row as belonging to the page', () => {
    assert.equal(commentBelongsToPage({ ...pageComment, is_hidden: true }, { type: 'game', id: GAME }), false)
  })

  it('stores a bare page link, and an unrecognised url as a link', () => {
    const pageOnly = parseReportUrl(`https://${HOST}/games/${GAME}`, HOST)
    assert.deepEqual(reportTargetFromParsed(pageOnly, null), { type: 'game', id: GAME })
    assert.deepEqual(reportTargetFromParsed(null, null), { type: 'link', id: null })
  })
})
