import Image from 'next/image'
import { isOwnStorageUrl } from '@/lib/storage'
import { notFound, redirect } from 'next/navigation'
import MemeForm from '@/components/memes/MemeForm'
import PageHeader from '@/components/ui/PageHeader'
import { getMemeForEdit } from '@/lib/queries/memes'
import { getViewer } from '@/lib/server/viewer'
import { updateMeme } from '../../actions'

export const metadata = { title: 'Edit meme' }

export default async function EditMemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const meme = await getMemeForEdit(id)
  if (!meme) notFound()
  const { userId } = await getViewer()
  if (meme.author_id !== userId) redirect('/memes')
  return (
    <>
      <PageHeader emoji="✏️" title="Edit meme" />
      {isOwnStorageUrl(meme.image_url) && <Image src={meme.image_url!} alt="" width={600} height={450} className="rounded-2xl mb-6 max-w-sm h-auto border border-border" />}
      {meme.is_hidden ? <p className="card-glass p-4 text-sm text-text-secondary max-w-2xl" data-testid="edit-locked">🙈 A moderator has hidden this post, so it can&apos;t be edited right now.</p> : <MemeForm action={updateMeme} defaults={meme} submitLabel="Save changes" />}
    </>
  )
}
