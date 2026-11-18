import Link from 'next/link'
import { redirect } from 'next/navigation'
import AuthPanel from '../AuthPanel'
import UpdatePasswordForm from './UpdatePasswordForm'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Set a new password' }

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } }
  if (!user) {
    redirect('/forgot-password?error=link')
  }
  return (
    <AuthPanel>
      <h1 className="font-display font-normal text-h1 lg:text-h1-lg tracking-h1 text-ink mb-2">Set a new password</h1>
      <p className="text-ink-2 text-sm mb-6">Choose a new password for your account.</p>
      <UpdatePasswordForm />
      <p className="mt-6 flex min-h-11 items-center text-ink-2 text-sm">
        <Link href="/sign-in" className="link">Back to sign in</Link>
      </p>
    </AuthPanel>
  )
}
