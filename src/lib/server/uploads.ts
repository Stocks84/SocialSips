import 'server-only'
import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'
import { storagePathFromUrl } from '@/lib/storage'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_EDGE = 1600
const MAX_GIF_FRAMES = 150

type Kind = 'jpeg' | 'png' | 'webp' | 'gif'
const OUT: Record<Kind, { ext: string; type: string }> = {
  jpeg: { ext: 'jpg', type: 'image/jpeg' },
  png: { ext: 'png', type: 'image/png' },
  webp: { ext: 'webp', type: 'image/webp' },
  gif: { ext: 'gif', type: 'image/gif' },
}

export type Bucket = 'game-covers' | 'cocktails' | 'memes' | 'avatars'

// Server-only secret: grant_upload() refuses calls without it, so the browser can't
// write to Storage directly (the storage INSERT policy needs a server-made grant).
const secret = () => process.env.AUTH_THROTTLE_SECRET

const BAD_TYPE = 'Image must be a JPG, PNG, WebP or GIF'
const FAILED = 'Image upload failed. Use a JPG, PNG, WebP or GIF under 4 MB.'

/** Real image type from the file's first bytes (ignores the browser-claimed type and file name). */
export function sniffImage(b: Uint8Array): Kind | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
      && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'png'
  const ascii = (s: number, e: number) => String.fromCharCode(...b.subarray(s, e))
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  if (b.length >= 6 && (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a')) return 'gif'
  return null
}

/**
 * Decodes and re-encodes the image so no metadata (EXIF/GPS, XMP, comments) survives.
 * Applies the EXIF orientation first, caps the long edge at 1600 px, keeps GIF animation.
 */
export async function cleanImage(input: Buffer, kind: Kind): Promise<Buffer> {
  if (kind === 'gif') {
    const meta = await sharp(input, { animated: true, limitInputPixels: 60_000_000 }).metadata()
    const frames = meta.pages ?? 1
    const img = sharp(input, { animated: frames <= MAX_GIF_FRAMES, limitInputPixels: 60_000_000 })
    // Too many frames: keep the first frame only (as a still GIF) to bound CPU and size.
    const w = meta.width ?? 0, h = meta.pageHeight ?? meta.height ?? 0
    if (Math.max(w, h) > MAX_EDGE) img.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    return img.gif().toBuffer()
  }
  const img = sharp(input, { limitInputPixels: 60_000_000 })
    .rotate() // bake in EXIF orientation before the metadata is dropped
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
  // sharp writes no metadata unless .withMetadata()/.keepExif() is called.
  if (kind === 'jpeg') return img.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  if (kind === 'png') return img.png({ compressionLevel: 9 }).toBuffer()
  return img.webp({ quality: 80 }).toBuffer()
}

/**
 * Checks, cleans and uploads form field `field` to <bucket>/<user_id>/<uuid>.<ext>.
 * Returns { url } (null if no file) or { error }. Counts against the user's daily upload quota.
 */
export async function uploadImage(supabase: SupabaseClient, bucket: Bucket, userId: string, formData: FormData, field = 'cover') {
  const file = formData.get(field)
  if (!(file instanceof File) || file.size === 0) return { url: null }
  if (file.size > MAX_IMAGE_BYTES) return { error: 'Image must be under 4 MB' }
  const input = Buffer.from(await file.arrayBuffer())
  const kind = sniffImage(input)
  if (!kind) return { error: BAD_TYPE }

  let body: Buffer
  try {
    body = await cleanImage(input, kind)
  } catch (e) {
    console.error('upload: image decode failed', e instanceof Error ? e.message : e)
    return { error: 'That image looks damaged. Try another one.' }
  }
  if (body.length > MAX_IMAGE_BYTES) return { error: 'Image must be under 4 MB' }

  const s = secret()
  if (!s) {
    console.error('AUTH_THROTTLE_SECRET is not set; uploads disabled')
    return { error: FAILED }
  }
  const { ext, type } = OUT[kind]
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const grant = await supabase.rpc('grant_upload', { p_secret: s, p_bucket: bucket, p_name: path, p_bytes: body.length })
  if (grant.error) {
    if (grant.error.message?.includes('upload_quota')) return { error: 'You’ve hit today’s image upload limit. Try again tomorrow 🍹' }
    console.error('grant_upload', grant.error.code, grant.error.message)
    return { error: FAILED }
  }
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: type, upsert: false })
  if (error) {
    console.error('upload', error.message)
    return { error: FAILED }
  }
  return { url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl }
}

/** Deletes the stored file behind `url`. With `ownerId`, only files in that user's folder are touched. */
export async function removeImage(supabase: SupabaseClient, bucket: Bucket, url: string | null | undefined, ownerId?: string | null) {
  const path = storagePathFromUrl(url, bucket)
  if (ownerId !== undefined && (!ownerId || !path?.startsWith(`${ownerId}/`))) return
  if (path) await supabase.storage.from(bucket).remove([path])
}
