import Link from 'next/link'

export const metadata = { title: 'Sign in' }

export default function SignInPage() {
  return (
    <>
      <h1 className="text-2xl font-black mb-6">Welcome back 👋</h1>
      {/* TODO (Auth sprint): wire to supabase.auth.signInWithPassword via a Server Action */}
      <form className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" required />
        </div>
        <button type="button" className="btn-primary w-full">Sign in</button>
      </form>
      <p className="text-text-secondary text-sm mt-6 text-center">
        New here? <Link href="/sign-up" className="text-accent-purple">Create an account</Link>
      </p>
    </>
  )
}
