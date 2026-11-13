import Link from 'next/link'
import { navItems, adminNavItem } from './navItems'
import NavLinks from './NavLinks'
import AuthButton from './AuthButton'

/** App-shell header: solid bottle green, brass double rule underneath, no blur. */
export default function TopNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const items = isAdmin ? [...navItems, adminNavItem] : navItems
  return (
    <nav className="sticky top-0 z-40 bg-bg safe-top" aria-label="Main navigation">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="shrink-0 font-display text-wordmark text-ink">Social Sips</Link>
          <NavLinks items={items} />
          <AuthButton />
        </div>
        <div className="rule-double" aria-hidden="true" />
      </div>
    </nav>
  )
}
