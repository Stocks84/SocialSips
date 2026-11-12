import Link from 'next/link'
import { navItems, adminNavItem } from './navItems'
import NavLinks from './NavLinks'
import AuthButton from './AuthButton'

export default function TopNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const items = isAdmin ? [...navItems, adminNavItem] : navItems
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur safe-top" aria-label="Main navigation">
      <div className="page-container flex items-center justify-between py-4 gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl" aria-hidden="true">🍻</span>
          <span className="font-black text-lg gradient-text tracking-tight">Social Sips</span>
        </Link>
        <NavLinks items={items} />
        <AuthButton />
      </div>
    </nav>
  )
}
