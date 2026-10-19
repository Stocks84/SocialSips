'use client'
import { useActionState, useState } from 'react'
import Image from 'next/image'
import { shrinkImage } from '@/lib/image'
import FieldError from '@/components/ui/FieldError'
import { PROFILE_LIMITS } from '@/lib/validators/profile'
import type { EditState } from '@/lib/validators/issues'

type Props = {
  action: (prev: EditState, fd: FormData) => Promise<EditState>
  defaults: { username: string; display_name: string | null; bio: string | null; avatar_url: string | null }
  avatarIsOwn: boolean
}

/** Edit display name, bio and avatar. Username is shown but can't be changed. */
export default function ProfileForm({ action: serverAction, defaults, avatarIsOwn }: Props) {
  const [state, action, pending] = useActionState<EditState, FormData>(serverAction, {})
  const val = (k: string, d?: string | null) => { const v = state.values?.[k]; return typeof v === 'string' ? v : (d ?? '') }
  const err = (k: string) => state.fieldErrors?.[k]
  const [bioLen, setBioLen] = useState(val('bio', defaults.bio).length)

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget
    const file = input.files?.[0]
    if (!file || input.dataset.shrunk === file.name) return
    try {
      const small = await shrinkImage(file, 512)
      if (small !== file) {
        const dt = new DataTransfer()
        dt.items.add(small)
        input.dataset.shrunk = small.name
        input.files = dt.files
      }
    } catch {
      // The server re-encodes anyway.
    }
  }

  return (
    <form action={action} className="card p-6 space-y-5 max-w-2xl" data-testid="profile-form">
      <div>
        <span className="label">Username</span>
        <p className="input bg-transparent text-text-secondary cursor-not-allowed" aria-readonly="true" data-testid="username-readonly">@{defaults.username}</p>
        <p className="text-text-muted text-xs mt-1">Usernames can&apos;t be changed (links to your profile keep working).</p>
      </div>
      <div>
        <label className="label" htmlFor="displayName">Display name</label>
        <input id="displayName" name="displayName" maxLength={PROFILE_LIMITS.displayName} className="input" defaultValue={val('displayName', defaults.display_name)} placeholder="How your name shows on your profile" aria-describedby="displayName-error" />
        <FieldError id="displayName" message={err('displayName')} />
      </div>
      <div>
        <label className="label" htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" rows={3} maxLength={PROFILE_LIMITS.bio} className="input" defaultValue={val('bio', defaults.bio)} onChange={(e) => setBioLen(e.target.value.length)} placeholder="Signature drink, party trick, favourite game…" aria-describedby="bio-error" />
        <p className="text-text-muted text-xs mt-1 text-right" data-testid="bio-count">{bioLen}/{PROFILE_LIMITS.bio}</p>
        <FieldError id="bio" message={err('bio')} />
      </div>
      <div>
        <label className="label" htmlFor="avatar">{defaults.avatar_url ? 'Replace photo (optional)' : 'Profile photo (optional)'}</label>
        <div className="flex items-center gap-4">
          {avatarIsOwn && defaults.avatar_url && (
            <Image src={defaults.avatar_url} alt="Current photo" width={64} height={64} className="w-16 h-16 rounded-full object-cover border border-border shrink-0" data-testid="avatar-current" />
          )}
          <input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input" onChange={onAvatar} />
        </div>
        <p className="text-text-muted text-xs mt-1">JPG, PNG, WebP or GIF, max 4 MB. Location data is stripped.</p>
        <FieldError id="avatar" message={err('avatar')} />
        {defaults.avatar_url && (
          <label className="flex items-center gap-2 text-sm text-text-secondary mt-2">
            <input type="checkbox" name="removeAvatar" value="true" className="accent-accent-pink" /> Remove current photo
          </label>
        )}
      </div>
      {state.error && <p className="error-msg" role="alert">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save profile'}</button>
    </form>
  )
}
