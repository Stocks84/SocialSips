'use client'
import { useActionState } from 'react'
import { shrinkImage } from '@/lib/image'

type FormState = { error?: string }
type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>
  defaults?: { id: string; caption: string | null; joke_text: string | null; image_url: string | null }
  submitLabel: string
}

/** Shared create/edit meme form. Images are shrunk to 1200px in the browser. */
export default function MemeForm({ action: serverAction, defaults, submitLabel }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(serverAction, {})

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
      {defaults && <input type="hidden" name="memeId" value={defaults.id} />}
      <div>
        <label className="label" htmlFor="image">{defaults?.image_url ? 'Replace image (optional)' : 'Meme image'}</label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input" onChange={onImage} />
        <p className="text-text-muted text-xs mt-1">Resized to max 1200px before upload.</p>
      </div>
      <div>
        <label className="label" htmlFor="caption">Caption</label>
        <input id="caption" name="caption" maxLength={200} className="input" defaultValue={defaults?.caption ?? ''} />
      </div>
      <div>
        <label className="label" htmlFor="jokeText">…or just a joke (optional)</label>
        <textarea id="jokeText" name="jokeText" maxLength={500} rows={3} className="input" defaultValue={defaults?.joke_text ?? ''} />
      </div>
      {state.error && <p className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? 'Saving…' : submitLabel}</button>
    </form>
  )
}
