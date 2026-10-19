import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import ProfileForm from '@/components/profile/ProfileForm'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { isOwnStorageUrl } from '@/lib/storage'
import { updateProfile } from '../actions'

export const metadata = { title: 'Edit profile' }

export default async function EditProfilePage() {
  const { userId } = await getViewer()
  if (!userId) redirect('/sign-in?redirectTo=/settings/profile')
  const supabase = await createClient()
  if (!supabase) notFound()
  const { data: me } = await supabase.from('profiles').select('username, display_name, bio, avatar_url').eq('id', userId).maybeSingle()
  if (!me) notFound()
  return (
    <>
      <Link href={`/profile/${me.username}`} className="text-sm text-text-secondary hover:text-accent-cyan">← Back to your profile</Link>
      <div className="mt-3"><PageHeader emoji="⚙️" title="Edit profile" subtitle="This is what others see on your profile." /></div>
      <ProfileForm action={updateProfile} defaults={me} avatarIsOwn={isOwnStorageUrl(me.avatar_url)} />
    </>
  )
}
