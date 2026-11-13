import AuthPanel from '../AuthPanel'
import Link from 'next/link'
import SignUpForm from './SignUpForm'

export const metadata = { title: 'Sign up' }

export default function SignUpPage() {
  return (
    <AuthPanel>
      <h1 className="font-display font-normal text-h1 lg:text-h1-lg tracking-h1 text-ink mb-2">Create an account</h1>
      <p className="text-ink-2 text-sm mb-6">18+ only. We check your date of birth.</p>
      <SignUpForm />
      <p className="text-ink-2 text-sm mt-6">
        Already in? <Link href="/sign-in" className="link">Sign in</Link>
      </p>
    </AuthPanel>
  )
}
