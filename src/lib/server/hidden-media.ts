import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { HIDDEN_BUCKET, hiddenObjectName, imagePathFromUrl, isMissingObject, type HideableBucket } from '@/lib/hidden-media'

export type MoveResult = { ok: true; moved: boolean } | { ok: false }

/**
 * Hide: move the item's image out of its PUBLIC bucket into the private hidden-media bucket
 * (Storage "move": a metadata move, same bytes, same path). Needs the admin storage policies from migration 0041.
 * Safe to repeat: if the file is already in hidden-media (or there is no image) it reports ok.
 */
export async function hideImage(supabase: SupabaseClient, bucket: HideableBucket, url: string | null | undefined): Promise<MoveResult> {
  const path = imagePathFromUrl(url, bucket)
  if (!path) return { ok: true, moved: false }
  const hidden = hiddenObjectName(bucket, path)
  const { error } = await supabase.storage.from(bucket).move(path, hidden, { destinationBucket: HIDDEN_BUCKET })
  if (!error) return { ok: true, moved: true }
  // Source gone: fine if the file is already private (earlier hide / sweep), or lost altogether.
  if (isMissingObject(error)) {
    const { data: stillPublic } = await supabase.storage.from(bucket).exists(path)
    return stillPublic ? { ok: false } : { ok: true, moved: false }
  }
  console.error('hideImage', bucket, error.message)
  return { ok: false }
}

/**
 * Unhide: move the image back to its public bucket and original path, so the URL stored on the row works again.
 * `ok: false` means the file is still private and the caller should NOT unhide the item (it would show a broken image).
 */
export async function restoreImage(supabase: SupabaseClient, bucket: HideableBucket, url: string | null | undefined): Promise<MoveResult> {
  const path = imagePathFromUrl(url, bucket)
  if (!path) return { ok: true, moved: false }
  const hidden = hiddenObjectName(bucket, path)
  const { error } = await supabase.storage.from(HIDDEN_BUCKET).move(hidden, path, { destinationBucket: bucket })
  if (!error) return { ok: true, moved: true }
  if (isMissingObject(error)) {
    // Not in hidden-media: already public (item was hidden before 0041 / sweep never ran) or the file is gone.
    const { data: stillHidden } = await supabase.storage.from(HIDDEN_BUCKET).exists(hidden)
    return stillHidden ? { ok: false } : { ok: true, moved: false }
  }
  console.error('restoreImage', bucket, error.message)
  return { ok: false }
}
