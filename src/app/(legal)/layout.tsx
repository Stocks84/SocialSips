import Link from 'next/link'

/** Legal pages: reachable without the age gate or an account, so no app shell or session data. */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-rule">
        <div className="page-container py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-wordmark text-ink">Social Sips</Link>
          <nav className="flex gap-3 text-sm text-ink-2" aria-label="Legal">
            <Link href="/impressum" className="hover:text-ink">Impressum</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
          </nav>
        </div>
      </header>
      <main className="page-container py-8">{children}</main>
    </div>
  )
}
