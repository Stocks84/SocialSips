import { Suspense } from 'react'
import Link from 'next/link'
import AuthPanel from '../AuthPanel'
import ForgotPasswordForm from './ForgotPasswordForm'

export const metadata = { title: 'Forgot password' }

export default function ForgotPasswordPage() {
  return (
    <AuthPanel>
      <h1 className="font-display font-normal text-h1 lg:text-h1-lg tracking-h1 text-ink mb-2">Forgot password?</h1>
      <p className="text-ink-2 text-sm mb-6">Enter your email and we&apos;ll send a reset link if there&apos;s an account for it.</p>
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
      <p className="mt-6 flex min-h-11 items-center text-ink-2 text-sm">
        <Link href="/sign-in" className="link">Back to sign in</Link>
      </p>
    </AuthPanel>
  )
}
