import Link from 'next/link'

export default function SignInPrompt({ path, what }: { path: string; what: string }) {
  return (
    <p className="card p-4 text-sm text-ink-2">
      <Link href={`/sign-in?redirectTo=${path}`} className="text-accent font-medium">Sign in</Link> to {what}.
    </p>
  )
}
