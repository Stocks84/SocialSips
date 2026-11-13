import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import ProfileForm from '@/components/profile/ProfileForm'
import { getOwnProfileEdit } from '@/lib/queries/settings'
import { getViewer } from '@/lib/server/viewer'
import { isOwnStorageUrl } from '@/lib/storage'
import { updateProfile } from '../actions'

export const metadata = { title: 'Edit profile' }

export default async function EditProfilePage() {
  const { userId } = await getViewer()
  if (!userId) redirect('/sign-in?redirectTo=/settings/profile')
  const me = await getOwnProfileEdit(userId)
  if (!me) notFound()
  return (
    <>
      <Link href={`/profile/${me.username}`} className="text-sm text-ink-2 hover:text-ink">← Back to your profile</Link>
      <div className="mt-3"><PageHeader title="Edit profile" subtitle="This is what others see on your profile." /></div>
      <ProfileForm action={updateProfile} defaults={me} avatarIsOwn={isOwnStorageUrl(me.avatar_url)} />
    </>
  )
}
