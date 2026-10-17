import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { storagePathFromUrl } from '@/lib/storage'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

export type Bucket = 'game-covers' | 'cocktails' | 'memes' | 'avatars'

/** Uploads form field `field` to <bucket>/<user_id>/<uuid>.<ext>. Returns { url } (null if no file) or { error }. */
export async function uploadImage(supabase: SupabaseClient, bucket: Bucket, userId: string, formData: FormData, field = 'cover') {
  const file = formData.get(field)
  if (!(file instanceof File) || file.size === 0) return { url: null }
  const ext = IMAGE_TYPES[file.type]
  if (!ext) return { error: 'Image must be a JPG, PNG, WebP or GIF' }
  if (file.size > MAX_IMAGE_BYTES) return { error: 'Image must be under 4 MB' }
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type })
  if (error) {
    console.error('upload', error.message)
    return { error: 'Image upload failed. Use a JPG, PNG, WebP or GIF under 4 MB.' }
  }
  return { url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl }
}

/** Deletes the stored file behind `url`. With `ownerId`, only files in that user's folder are touched. */
export async function removeImage(supabase: SupabaseClient, bucket: Bucket, url: string | null | undefined, ownerId?: string | null) {
  const path = storagePathFromUrl(url, bucket)
  if (ownerId !== undefined && (!ownerId || !path?.startsWith(`${ownerId}/`))) return
  if (path) await supabase.storage.from(bucket).remove([path])
}
