import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import MemeForm from '@/components/memes/MemeForm'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/server/viewer'
import { updateMeme } from '../../actions'

export const metadata = { title: 'Edit meme' }

export default async function EditMemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const { data: meme } = await supabase.from('memes').select('id, caption, joke_text, image_url, author_id').eq('id', id).maybeSingle()
  if (!meme) notFound()
  const { userId } = await getViewer()
  if (meme.author_id !== userId) redirect('/memes')
  return (
    <>
      <PageHeader emoji="✏️" title="Edit meme" />
      {meme.image_url && <Image src={meme.image_url} alt="" width={600} height={450} className="rounded-2xl mb-6 max-w-sm h-auto border border-border" />}
      <MemeForm action={updateMeme} defaults={meme} submitLabel="Save changes" />
    </>
  )
}
