import Link from 'next/link'
import { L } from '@/components/legal/Legal'
import { createClient } from '@/lib/supabase/server'
import { REPORT_TARGETS } from '@/lib/validators/comment'
import ReportForm from './ReportForm'

export const metadata = { title: 'Report content', robots: { index: false } }

const LABELS: Record<string, string> = { game: 'Game', comment: 'Comment', variation: 'Game variation', cocktail: 'Cocktail', cocktail_variation: 'Cocktail variation', meme: 'Meme' }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ type?: string; id?: string }> }) {
  const { type, id } = await searchParams
  const exact = type && id && (REPORT_TARGETS as readonly string[]).includes(type) && UUID.test(id)
  const supabase = await createClient()
  const signedIn = Boolean(supabase && (await supabase.auth.getClaims()).data?.claims?.sub)
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight"><span aria-hidden="true">⚑</span> <span className="gradient-text">Report content or contact us</span></h1>
        <p className="text-text-secondary text-sm mt-2">Anyone can report illegal content or a breach of our <Link href="/terms" className="text-accent-purple">Terms</Link>, signed in or not. You can also email <L k="contactEmail" mailto />.</p>
      </header>
      <ReportForm targetType={exact ? type : undefined} targetId={exact ? id : undefined} targetLabel={exact ? LABELS[type!] : undefined} signedIn={signedIn} />
      <p className="text-text-muted text-xs">If someone is in immediate danger, call 112 (EU) or 999 (UK). For child sexual abuse material you don&apos;t have to give your name or email.</p>
    </div>
  )
}
