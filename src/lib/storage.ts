/** Extracts the object path from a Supabase public storage URL for the given bucket. */
export function storagePathFromUrl(url: string | null | undefined, bucket: string): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marker)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length))
}

/** True if `url` is a public object URL in this project's storage (safe to pass to next/image). */
export function isOwnStorageUrl(url: string | null | undefined): url is string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || !base) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.origin === new URL(base).origin && u.pathname.startsWith('/storage/v1/object/public/')
  } catch {
    return false
  }
}
