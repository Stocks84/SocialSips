/**
 * Parse a Social Sips link from the public /report form.
 * A game/drink/meme path can also point at one comment via #comment-<id> or ?comment=<id>.
 * No server or alias imports, so unit tests can load this file directly.
 */

export type PageTargetType = 'game' | 'cocktail' | 'meme'
export type PageTarget = { type: PageTargetType; id: string }
export type ParsedReportUrl = { page: PageTarget; commentId: string | null }

export const COMMENT_ANCHOR_PREFIX = 'comment-'
export const UUID_RE = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const UUID = new RegExp(`^${UUID_RE}$`, 'i')

const PATHS: [RegExp, PageTargetType][] = [
  [new RegExp(`^/memes/(${UUID_RE})(?:/|$)`, 'i'), 'meme'],
  [new RegExp(`^/games/(${UUID_RE})(?:/|$)`, 'i'), 'game'],
  [new RegExp(`^/cocktails/(${UUID_RE})(?:/|$)`, 'i'), 'cocktail'],
]

/** DOM id / hash for a comment permalink, e.g. comment-<uuid>. */
export function commentAnchorId(commentId: string): string {
  return `${COMMENT_ANCHOR_PREFIX}${commentId}`
}

/** Path plus hash, e.g. /games/<id>#comment-<commentId>. */
export function commentPermalink(path: string, commentId: string): string {
  return `${path}#${commentAnchorId(commentId)}`
}

/** Admin (and in-app) link to the comment on its parent page. Null if the parent is missing. */
export function commentHref(
  comment: { game_id: string | null; cocktail_id: string | null; meme_id: string | null },
  commentId: string,
): string | null {
  const base = comment.game_id
    ? `/games/${comment.game_id}`
    : comment.meme_id
      ? `/memes/${comment.meme_id}`
      : comment.cocktail_id
        ? `/cocktails/${comment.cocktail_id}`
        : null
  return base ? commentPermalink(base, commentId) : null
}

function commentIdFromUrl(u: URL): string | null {
  const hash = decodeURIComponent(u.hash.replace(/^#/, ''))
  const fromHash = new RegExp(`^${COMMENT_ANCHOR_PREFIX}(${UUID_RE})$`, 'i').exec(hash)
  if (fromHash) return fromHash[1].toLowerCase()
  const q = u.searchParams.get('comment')
  if (q && UUID.test(q)) return q.toLowerCase()
  return null
}

/**
 * Read a pasted or pre-filled Social Sips content URL.
 * Returns null if it isn't a same-host game/drink/meme link (or isn't a URL).
 * A comment id is only taken from the hash or ?comment=; this function does not
 * check that the comment exists or is visible — do that at submit time.
 */
export function parseReportUrl(raw: string, host?: string | null): ParsedReportUrl | null {
  try {
    const u = new URL(raw.trim(), `https://${host ?? 'localhost'}`)
    if (host && u.host !== host) return null
    for (const [re, type] of PATHS) {
      const m = re.exec(u.pathname)
      if (m) return { page: { type, id: m[1].toLowerCase() }, commentId: commentIdFromUrl(u) }
    }
  } catch { /* not a URL */ }
  return null
}

export type CommentParentRow = {
  id: string
  game_id: string | null
  cocktail_id: string | null
  meme_id: string | null
  is_hidden: boolean
}

/** Visible comment that actually lives on this page. Hidden rows must not be used as a public target. */
export function commentBelongsToPage(comment: CommentParentRow, page: PageTarget): boolean {
  if (comment.is_hidden) return false
  if (page.type === 'game') return comment.game_id === page.id
  if (page.type === 'cocktail') return comment.cocktail_id === page.id
  return comment.meme_id === page.id
}

/**
 * Decide what to store on the report. If a comment id is present but the row is
 * missing, hidden, or on another page, fall back to the parent page — same as
 * pasting the page link, so we don't leak that a hidden comment exists.
 */
export function reportTargetFromParsed(
  parsed: ParsedReportUrl | null,
  comment: CommentParentRow | null,
): { type: PageTargetType | 'comment' | 'link'; id: string | null } {
  if (!parsed) return { type: 'link', id: null }
  if (
    parsed.commentId
    && comment
    && comment.id === parsed.commentId
    && commentBelongsToPage(comment, parsed.page)
  ) {
    return { type: 'comment', id: comment.id }
  }
  return { type: parsed.page.type, id: parsed.page.id }
}
