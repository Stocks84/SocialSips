import MemeForm from '@/components/memes/MemeForm'
import PageHeader from '@/components/ui/PageHeader'
import { createMeme } from '../actions'

export const metadata = { title: 'Post a meme' }

export default function NewMemePage() {
  return (
    <>
      <PageHeader title="Post a meme" subtitle="Keep it fun, keep it kind." />
      <MemeForm action={createMeme} submitLabel="Post it" />
    </>
  )
}
