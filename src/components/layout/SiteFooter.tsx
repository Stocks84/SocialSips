import Link from 'next/link'

/** Global footer on every page (legal links are reachable without the age gate). Extra bottom padding on mobile clears the tab bar. */
export default function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-4 pb-24 sm:pb-4 text-center text-xs text-text-muted space-y-2" data-testid="site-footer">
      <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link href="/impressum" className="hover:text-accent-cyan">Impressum</Link>
        <Link href="/privacy" className="hover:text-accent-cyan">Privacy</Link>
        <Link href="/terms" className="hover:text-accent-cyan">Terms</Link>
        <Link href="/report" className="hover:text-accent-cyan">Report content</Link>
      </nav>
      <p><span className="gradient-text font-semibold">Social Sips</span> – Version 1</p>
    </footer>
  )
}
