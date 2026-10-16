import Link from 'next/link'
import { navItems } from './navItems'
import AuthButton from './AuthButton'

export default function TopNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur safe-top" aria-label="Main navigation">
      <div className="page-container flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">🍻</span>
          <span className="font-black text-lg gradient-text tracking-tight">Social Sips</span>
        </Link>
        <div className="hidden sm:flex items-center gap-1">
          {navItems.map((i) => (
            <Link key={i.href} href={i.href} className="btn-ghost text-sm">
              {i.emoji} {i.label}
            </Link>
          ))}
        </div>
        <AuthButton />
      </div>
    </nav>
  )
}
