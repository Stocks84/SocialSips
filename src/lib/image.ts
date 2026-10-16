/** Client-side: downscale an image to max `maxSize` px on the long edge and re-encode (WebP, JPEG fallback). */
export async function shrinkImage(file: File, maxSize = 1600, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file // keep GIF animation
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality))
  let blob = await toBlob('image/webp')
  let type = 'image/webp'
  if (!blob || blob.type !== 'image/webp') {
    blob = await toBlob('image/jpeg')
    type = 'image/jpeg'
  }
  if (!blob || blob.size >= file.size) return file
  const base = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${base}.${type === 'image/webp' ? 'webp' : 'jpg'}`, { type })
}
