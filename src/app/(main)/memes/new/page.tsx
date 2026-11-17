import MemeForm from '@/components/memes/MemeForm'
import PageHeader from '@/components/ui/PageHeader'
import SuspendedFormBlock from '@/components/ui/SuspendedFormBlock'
import { getViewer } from '@/lib/server/viewer'
import { createMeme } from '../actions'

export const metadata = { title: 'Post a meme' }

export default async function NewMemePage() {
  const { suspended } = await getViewer()
  return (
    <>
      <PageHeader title="Post a meme" subtitle="Keep it fun, keep it kind." />
      {suspended ? <SuspendedFormBlock action="post a meme" reason={suspended.reason} /> : (
        <MemeForm action={createMeme} submitLabel="Post it" />
      )}
    </>
  )
}
