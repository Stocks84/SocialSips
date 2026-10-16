import Link from 'next/link'
import { Suspense } from 'react'
import SignInForm from './SignInForm'

export const metadata = { title: 'Sign in' }

export default function SignInPage() {
  return (
    <>
      <h1 className="text-2xl font-black mb-6">Welcome back 👋</h1>
      <Suspense>
        <SignInForm />
      </Suspense>
      <p className="text-text-secondary text-sm mt-6 text-center">
        New here? <Link href="/sign-up" className="text-accent-purple">Create an account</Link>
      </p>
    </>
  )
}
