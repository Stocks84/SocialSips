import { setFollow } from '@/app/(main)/settings/actions'

export default function FollowButton({ userId, username, following }: { userId: string; username: string; following: boolean }) {
  return (
    <form action={setFollow}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="follow" value={following ? '0' : '1'} />
      <input type="hidden" name="back" value={`/profile/${username}`} />
      <button className={following ? 'btn-secondary text-sm py-1.5 px-4' : 'btn-primary text-sm py-1.5 px-4'} data-testid={following ? 'unfollow-btn' : 'follow-btn'}>
        {following ? '✓ Following' : '➕ Follow'}
      </button>
    </form>
  )
}
