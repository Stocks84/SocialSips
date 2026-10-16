import Link from 'next/link'

export const metadata = { title: 'Sign up' }

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-2xl font-black mb-2">Join the party 🎉</h1>
      <p className="text-text-secondary text-sm mb-6">18+ only. We check your date of birth.</p>
      {/* TODO (Auth sprint): validate with signUpSchema, call supabase.auth.signUp with
          options.data = { username, date_of_birth } — the DB trigger creates the profile. */}
      <form className="space-y-4">
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" name="username" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="dateOfBirth">Date of birth</label>
          <input id="dateOfBirth" name="dateOfBirth" type="date" className="input" required />
        </div>
        <button type="button" className="btn-primary w-full">Create account</button>
      </form>
      <p className="text-text-secondary text-sm mt-6 text-center">
        Already in? <Link href="/sign-in" className="text-accent-purple">Sign in</Link>
      </p>
    </>
  )
}
