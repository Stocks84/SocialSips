import ProfileHeader from '@/components/profile/ProfileHeader'
import ComingSoon from '@/components/ui/ComingSoon'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <>
      <ProfileHeader username={decodeURIComponent(username)} />
      <h2 className="text-xl font-bold mb-3">Games they&apos;ve shared</h2>
      <ComingSoon />
    </>
  )
}
