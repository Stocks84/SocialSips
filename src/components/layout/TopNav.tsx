import Link from 'next/link'
import { navItems, adminNavItem } from './navItems'
import NavLinks from './NavLinks'
import AuthButton from './AuthButton'

/** App-shell header: solid bottle green, brass double rule underneath, no blur. */
export default function TopNav({ isAdmin = false, openReports = 0 }: { isAdmin?: boolean; openReports?: number }) {
  const items = isAdmin ? [...navItems, adminNavItem] : navItems
  return (
    <nav className="sticky top-0 z-40 bg-bg safe-top" aria-label="Main navigation">
      <div className="page-container px-2 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-1 sm:gap-3">
          <Link href="/" className="inline-flex min-h-11 shrink-0 items-center font-display text-wordmark text-ink">Social Sips</Link>
          <NavLinks items={items} openReports={openReports} />
          <AuthButton />
        </div>
        <div className="rule-double" aria-hidden="true" />
      </div>
    </nav>
  )
}
