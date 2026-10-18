'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems, adminNavItem } from './navItems'

/** Mobile app-style tab bar. */
export default function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const items = isAdmin ? [...navItems, adminNavItem] : navItems
  const pathname = usePathname()
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur safe-bottom" aria-label="Tab bar">
      <ul className={`grid ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
        {items.map((i) => {
          const active = pathname.startsWith(i.href)
          return (
            <li key={i.href}>
              <Link href={i.href} className={`flex flex-col items-center py-2 text-xs ${active ? 'text-accent-purple' : 'text-text-secondary'}`}>
                <span className="text-xl" aria-hidden="true">{i.emoji}</span>
                {i.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
