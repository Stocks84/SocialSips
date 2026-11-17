// Hidden items' images live in a PRIVATE bucket while the item is hidden (migration 0041).
// Object name there: '<original bucket>/<original path>', so unhide can put the file back exactly where
// the row's public URL points. Pure helpers only (no I/O, no imports) so they can be unit-tested.
export const HIDDEN_BUCKET = 'hidden-media'

/** Buckets whose images can belong to a hideable item (games, cocktails, memes). */
export type HideableBucket = 'game-covers' | 'cocktails' | 'memes'

/** Name of the file inside hidden-media for an image that normally lives at <bucket>/<path>. */
export function hiddenObjectName(bucket: HideableBucket, path: string): string {
  return `${bucket}/${path}`
}

/** Public path (inside `bucket`) for the row's image URL, or null when it has no image of ours. */
export function imagePathFromUrl(url: string | null | undefined, bucket: HideableBucket): string | null {
  // Same rule as storagePathFromUrl() in lib/storage.ts (kept inline so this file has no imports and runs under node --test).
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marker)
  const path = i === -1 ? null : decodeURIComponent(url.slice(i + marker.length))
  return path && path.length > 0 && !path.includes('..') ? path : null
}

/** True if a Storage error means "that object isn't there" (already moved, or never existed). */
export function isMissingObject(err: { message?: string; statusCode?: string | number; status?: number } | null | undefined): boolean {
  if (!err) return false
  const code = String(err.statusCode ?? err.status ?? '')
  return code === '404' || /not found|no such (key|object)|does not exist/i.test(err.message ?? '')
}
