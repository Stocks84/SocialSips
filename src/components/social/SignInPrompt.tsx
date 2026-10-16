import Link from 'next/link'

export default function SignInPrompt({ path, what }: { path: string; what: string }) {
  return (
    <p className="card-glass p-4 text-sm text-text-secondary">
      <Link href={`/sign-in?redirectTo=${path}`} className="text-accent-purple font-medium">Sign in</Link> to {what}.
    </p>
  )
}
