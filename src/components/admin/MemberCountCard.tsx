import { MEMBER_GOAL } from '@/lib/member-count'

/** Read-only “how many real members toward 50” card for the admin area. */
export default function MemberCountCard({ count }: { count: number }) {
  return (
    <p className="card p-4 mb-6 text-sm" data-testid="member-count">
      Members: {count} / {MEMBER_GOAL}
    </p>
  )
}
