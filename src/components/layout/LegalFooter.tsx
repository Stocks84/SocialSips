import Link from 'next/link'

const footerLink = 'inline-flex min-h-11 items-center text-sm text-ink-2 underline decoration-accent decoration-1 underline-offset-4 hover:decoration-ink'

/**
 * Global legal footer on every page (reachable without the age gate).
 * Pages with the mobile tab bar mark themselves with `data-tabbar` (see (main)/layout.tsx);
 * the `body:has([data-tabbar]) .site-footer` rule in globals.css then adds bottom space below 1024px so the footer clears it.
 */
export default function LegalFooter() {
  return (
    <footer className="site-footer page-container w-full pt-12" data-testid="site-footer">
      <div className="rule-double" aria-hidden="true" />
      <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 lg:gap-x-6">
          <Link href="/impressum" className={footerLink}>Impressum</Link>
          <Link href="/privacy" className={footerLink}>Privacy</Link>
          <Link href="/terms" className={footerLink}>Terms</Link>
          <Link href="/report" className={footerLink}>Report content</Link>
          {/* Visible route to /help on every page, incl. mobile app pages where the tab bar has no Help tab */}
          <Link href="/help" className={footerLink} data-testid="mobile-help-link">Help</Link>
        </nav>
        <div className="flex flex-col gap-1 text-meta text-ink-3 lg:flex-row lg:gap-6">
          <p>18+ only · Please drink responsibly</p>
          <p>Social Sips – Version 1</p>
        </div>
      </div>
    </footer>
  )
}
