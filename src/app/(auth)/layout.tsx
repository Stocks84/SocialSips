import Link from 'next/link'

/**
 * Auth shell for sign-in, sign-up and the age gate: wordmark header + brass double rule,
 * then the page content in a 960px column. The global LegalFooter follows (root layout).
 * Below 360px the side padding drops to 8px so Turnstile keeps ≥300px.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="page-container w-full max-[359px]:px-2">
        <div className="flex h-14 items-center lg:h-20">
          <Link href="/" className="font-display text-wordmark lg:text-wordmark-lg text-ink">Social Sips</Link>
        </div>
        <div className="rule-double" aria-hidden="true" />
      </header>
      <main className="mx-auto w-full max-w-240 flex-1 px-4 pt-8 max-[359px]:px-2 sm:px-6 lg:px-0 lg:pt-16">
        {children}
      </main>
    </div>
  )
}
