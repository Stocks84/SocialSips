import Link from 'next/link'

/** Legal pages: reachable without the age gate or an account, so no app shell or session data. */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-hero-glow">
      <header className="border-b border-border">
        <div className="page-container py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-lg gradient-text">🍻 Social Sips</Link>
          <nav className="flex gap-3 text-sm text-text-secondary" aria-label="Legal">
            <Link href="/impressum" className="hover:text-accent-cyan">Impressum</Link>
            <Link href="/privacy" className="hover:text-accent-cyan">Privacy</Link>
            <Link href="/terms" className="hover:text-accent-cyan">Terms</Link>
          </nav>
        </div>
      </header>
      <main className="page-container py-8">{children}</main>
    </div>
  )
}
