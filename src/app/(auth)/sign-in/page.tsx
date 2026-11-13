import Link from 'next/link'
import { Suspense } from 'react'
import SignInForm from './SignInForm'
import HangoverBoard from '@/components/ui/HangoverBoard'

export const metadata = { title: 'Sign in' }

function CreateAccount({ className = '' }: { className?: string }) {
  return (
    <p className={`flex min-h-11 items-center gap-1.5 text-ink-2 ${className}`}>
      New here? <Link href="/sign-up" className="link">Create an account</Link>
    </p>
  )
}

export default function SignInPage() {
  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-5">
        <h1 className="enter font-display font-normal text-h1 lg:text-h1-lg tracking-h1 text-ink">Sign in</h1>
        <CreateAccount className="mt-3 hidden lg:flex" />
        <div className="mt-10 hidden lg:block">
          <HangoverBoard size="compact" />
        </div>
      </div>
      {/* No opacity/transform entrance here: Turnstile's ancestors must stay unfiltered and fully opaque. */}
      <div className="mt-6 lg:col-span-6 lg:col-start-7 lg:mt-0">
        <div className="lg:rounded-sm lg:border lg:border-rule lg:bg-surface lg:p-8">
          <Suspense>
            <SignInForm />
          </Suspense>
        </div>
        <CreateAccount className="mt-4 lg:hidden" />
      </div>
    </div>
  )
}
