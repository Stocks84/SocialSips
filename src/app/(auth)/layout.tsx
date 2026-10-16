import Link from 'next/link'

/** Centered card layout for sign-in, sign-up and the age gate. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-hero-glow">
      <Link href="/" className="mb-8 font-black text-2xl gradient-text">🍻 Social Sips</Link>
      <div className="card w-full max-w-md p-8">{children}</div>
    </main>
  )
}
