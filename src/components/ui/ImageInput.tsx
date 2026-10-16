'use client'
import { useState } from 'react'
import { shrinkImage } from '@/lib/image'

/** File input that shrinks the chosen image in the browser before the form uploads it. */
export default function ImageInput({ label = 'Cover image (optional)', required = false }: { label?: string; required?: boolean }) {
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget
    const file = input.files?.[0]
    if (!file || input.dataset.shrunk === file.name) return
    setBusy(true)
    try {
      const small = await shrinkImage(file)
      if (small !== file) {
        const dt = new DataTransfer()
        dt.items.add(small)
        input.dataset.shrunk = small.name
        input.files = dt.files
      }
      setInfo(`${Math.round(file.size / 1024)} KB → ${Math.round(small.size / 1024)} KB`)
    } catch {
      setInfo(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <label className="label" htmlFor="cover">{label}</label>
      <input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input" onChange={onChange} required={required} />
      <p className="text-text-muted text-xs mt-1" data-testid="cover-info">
        {busy ? 'Shrinking…' : info ?? 'Resized to max 1600px before upload (max 4 MB).'}
      </p>
    </div>
  )
}
