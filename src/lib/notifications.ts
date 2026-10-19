import type { NotificationRow } from '@/lib/queries/follows'

const q = (s: string | null) => (s ? `“${s.length > 60 ? s.slice(0, 60) + '…' : s}”` : '')
const who = (n: NotificationRow, more = 'others') => {
  const a = n.actor ? `@${n.actor.username}` : 'Someone'
  return n.count > 1 ? `${a} and ${n.count - 1} ${n.count === 2 ? more.replace(/s$/, '') : more}` : a
}
const POST: Record<string, string> = { game: 'game', cocktail: 'cocktail', meme: 'meme' }

export function notificationText(n: NotificationRow): { icon: string; text: string } {
  switch (n.kind) {
    case 'follow': return { icon: '👋', text: `${who(n)} started following you` }
    case 'reaction': return { icon: '😂', text: `${who(n)} reacted to your meme ${q(n.preview)}` }
    case 'comment': return { icon: '💬', text: `${n.count > 1 ? `${n.count} new comments` : `${who(n)} commented`} on your ${POST[n.target_type] ?? 'post'} ${q(n.preview)}` }
    case 'variation': return { icon: '🔀', text: `${n.count > 1 ? `${n.count} new variations` : `${who(n)} added a variation`} to your ${POST[n.target_type] ?? 'post'} ${q(n.preview)}` }
    case 'challenge_votes': return { icon: '🗳️', text: `Your entry in ${q(n.preview)} got ${n.count} new vote${n.count === 1 ? '' : 's'}` }
    case 'challenge_win': return { icon: '🏆', text: `You won the challenge ${q(n.preview)}!` }
    case 'moderation': return { icon: '🛡️', text: `A moderator took action on your post ${q(n.preview)}. See why.` }
  }
}

export function notificationHref(n: NotificationRow, me: string): string {
  if (n.kind === 'follow') return n.actor ? `/profile/${n.actor.username}` : `/profile/${me}/followers`
  if (n.kind === 'moderation') return `/profile/${me}#moderation-notices`
  if (n.target_type === 'challenge') return `/challenge/${n.target_id}`
  if (n.target_type === 'game') return `/games/${n.target_id}`
  if (n.target_type === 'cocktail') return `/cocktails/${n.target_id}`
  if (n.target_type === 'meme') return `/memes/${n.target_id}`
  return '/notifications'
}
