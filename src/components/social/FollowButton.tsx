import { setFollow } from '@/app/(main)/settings/actions'
import SubmitButton from '@/components/ui/SubmitButton'

export default function FollowButton({ userId, username, following, suspended = false }: { userId: string; username: string; following: boolean; suspended?: boolean }) {
  // Unfollowing still works while suspended; following is blocked by the server, so don't offer it.
  if (suspended && !following) return <span className="text-ink-3 text-xs" data-testid="follow-suspended">Following is paused while your account is suspended.</span>
  return (
    <form action={setFollow}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="follow" value={following ? '0' : '1'} />
      <input type="hidden" name="back" value={`/profile/${username}`} />
      <SubmitButton className={following ? 'btn-secondary text-sm py-1.5 px-4' : 'btn-primary text-sm py-1.5 px-4'} data-testid={following ? 'unfollow-btn' : 'follow-btn'} pendingLabel={following ? 'Unfollowing…' : 'Following…'}>
        {following ? '✓ Following' : 'Follow'}
      </SubmitButton>
    </form>
  )
}
