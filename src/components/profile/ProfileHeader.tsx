import Image from 'next/image'
import Link from 'next/link'
import { isOwnStorageUrl } from '@/lib/storage'

type Props = { username: string; displayName?: string | null; bio?: string | null; avatarUrl?: string | null; isOwner?: boolean }

export default function ProfileHeader({ username, displayName, bio, avatarUrl, isOwner = false }: Props) {
  return (
    <div className="card p-6 flex flex-col sm:flex-row sm:items-center gap-5 mb-8" data-testid="profile-header">
      {isOwnStorageUrl(avatarUrl) ? (
        <Image src={avatarUrl} alt={`@${username}`} width={80} height={80} className="w-20 h-20 rounded-full object-cover border border-border shadow-neon-purple shrink-0" data-testid="profile-avatar" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-purple-cyan flex items-center justify-center text-3xl shadow-neon-purple shrink-0" aria-hidden="true">🥳</div>
      )}
      <div className="min-w-0 flex-1">
        {displayName ? (
          <>
            <h1 className="text-2xl font-black break-words" data-testid="profile-display-name">{displayName}</h1>
            <p className="text-text-secondary text-sm">@{username}</p>
          </>
        ) : (
          <h1 className="text-2xl font-black break-words">@{username}</h1>
        )}
        {bio ? (
          <p className="text-sm mt-2 whitespace-pre-line break-words" data-testid="profile-bio">{bio}</p>
        ) : (
          <p className="text-text-secondary text-sm">Party vibe: ✨ to be chosen · Favourite drink: 🍹 TBC</p>
        )}
      </div>
      {isOwner && <Link href="/settings/profile" className="btn-secondary text-sm py-2 px-4 shrink-0 self-start" data-testid="edit-profile-link">✏️ Edit profile</Link>}
    </div>
  )
}
