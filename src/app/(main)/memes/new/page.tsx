import MemeForm from '@/components/memes/MemeForm'
import PageHeader from '@/components/ui/PageHeader'

export const metadata = { title: 'Post a meme' }

export default function NewMemePage() {
  return (
    <>
      <PageHeader emoji="😂" title="Post a meme" subtitle="Keep it fun, keep it kind." />
      <MemeForm />
    </>
  )
}
