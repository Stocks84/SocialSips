/** Shared paging settings for list pages (feed, cocktails, games). */

/** Page size for the feed and the list pages. */
export const PAGE_SIZE = 20
/** One extra row lets the caller see whether another page exists. */
export const PAGE_TAKE = PAGE_SIZE + 1

export type Cursor = { at: string; id: string }

const TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}(:?\d{2})?)$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Keyset cursor "<created_at>_<id>" for newest-first lists. Anything malformed is ignored (back to page 1). */
export function parseCursor(v: string | undefined): Cursor | null {
  if (!v) return null
  const i = v.lastIndexOf('_')
  const at = v.slice(0, i)
  const id = v.slice(i + 1)
  return i > 0 && TS.test(at) && UUID.test(id) ? { at, id } : null
}

export const encodeCursor = (c: Cursor) => `${c.at}_${c.id}`

/** PostgREST filter for rows strictly after the cursor in (created_at desc, id desc) order. Ties on created_at are common (seed data). */
export const olderThan = (c: Cursor) => `created_at.lt."${c.at}",and(created_at.eq."${c.at}",id.lt.${c.id})`

/** Same (created_at desc, id desc) order in JS, for merging games and memes. */
export const newestFirst = (a: Cursor, b: Cursor) => (a.at === b.at ? (a.id < b.id ? 1 : a.id > b.id ? -1 : 0) : a.at < b.at ? 1 : -1)

export type RpcPageArgs = { max_rows: number; before_at?: string; before_id?: string; row_offset?: number }

/**
 * Named args for the paged feed RPCs.
 * First page of a newest list only sends max_rows, so it still works against the pre-0032 functions.
 * later pages send before_at/before_id (newest) or row_offset (top), which need migration 0032.
 */
export function rpcPage({ limit, before = null, offset = 0, top = false }: { limit: number; before?: Cursor | null; offset?: number; top?: boolean }): RpcPageArgs {
  const args: RpcPageArgs = { max_rows: limit }
  if (!top && before) {
    args.before_at = before.at
    args.before_id = before.id
  }
  if (top && offset > 0) args.row_offset = offset
  return args
}
