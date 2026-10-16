'use client'
import { useActionState } from 'react'
import { createMeme } from '@/app/(main)/memes/actions'
import { shrinkImage } from '@/lib/image'

export default function MemeForm() {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(createMeme, {})

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget
    const file = input.files?.[0]
    if (!file || input.dataset.shrunk === file.name) return
    const small = await shrinkImage(file, 1200)
    if (small !== file) {
      const dt = new DataTransfer()
      dt.items.add(small)
      input.dataset.shrunk = small.name
      input.files = dt.files
    }
  }

  return (
    <form action={action} className="card p-6 space-y-5 max-w-2xl">
      <div>
        <label className="label" htmlFor="image">Meme image</label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input" onChange={onImage} />
        <p className="text-text-muted text-xs mt-1">Resized to max 1200px before upload.</p>
      </div>
      <div>
        <label className="label" htmlFor="caption">Caption</label>
        <input id="caption" name="caption" maxLength={200} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="jokeText">…or just a joke (optional)</label>
        <textarea id="jokeText" name="jokeText" maxLength={500} rows={3} className="input" />
      </div>
      {state.error && <p className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? 'Posting…' : 'Post it 😂'}</button>
    </form>
  )
}
