import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LEGAL } from '@/lib/legal'
import { signOut } from '@/app/(auth)/actions'
import AcceptForm from './AcceptForm'

export const metadata = { title: 'Accept the Terms', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function AcceptTermsPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '/feed' } = await searchParams
  const supabase = await createClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null
  if (!user || !supabase) redirect('/sign-in')
  const { data: accepted } = await supabase.rpc('my_terms_version')
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/feed'
  if (accepted === LEGAL.termsVersion) redirect(safe)
  return (
    <div className="max-w-xl mx-auto">
      <div className="card-glass p-6 sm:p-8 space-y-5" data-testid="accept-terms">
        <h1 className="text-2xl sm:text-3xl font-black gradient-text">📜 {accepted ? 'We’ve updated our Terms' : 'Please accept our Terms'}</h1>
        <p className="text-text-secondary text-sm">
          {accepted ? 'Our Terms of Use and Privacy Policy have changed since you last accepted them.' : 'Before you continue, please read and accept our Terms of Use and Privacy Policy.'}{' '}
          You can read them first: <Link href="/terms" className="text-accent-purple">Terms of Use</Link> · <Link href="/privacy" className="text-accent-purple">Privacy Policy</Link>.
        </p>
        <AcceptForm next={safe} />
        <div className="border-t border-border pt-4 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
          <form action={signOut}><button className="btn-ghost text-sm" data-testid="accept-signout">Sign out</button></form>
          <Link href="/settings/account" className="hover:text-accent-cyan" data-testid="accept-account">Don’t agree? Download your data or delete your account</Link>
        </div>
      </div>
    </div>
  )
}
