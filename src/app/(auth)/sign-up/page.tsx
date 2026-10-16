import Link from 'next/link'
import SignUpForm from './SignUpForm'

export const metadata = { title: 'Sign up' }

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-2xl font-black mb-2">Join the party 🎉</h1>
      <p className="text-text-secondary text-sm mb-6">18+ only. We check your date of birth.</p>
      <SignUpForm />
      <p className="text-text-secondary text-sm mt-6 text-center">
        Already in? <Link href="/sign-in" className="text-accent-purple">Sign in</Link>
      </p>
    </>
  )
}
