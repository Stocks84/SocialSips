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
      <ul className={`grid ${isAdmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
        {items.map((i) => {
          const active = pathname.startsWith(i.href)
          return (
            <li key={i.href}>
              <Link href={i.href} className={`flex flex-col items-center py-2 ${isAdmin ? 'text-[11px]' : 'text-xs'} ${active ? 'text-accent-purple' : 'text-text-secondary'}`}>
                <span className="text-xl" aria-hidden="true">{i.emoji}</span>
                <span className="max-w-full truncate px-0.5">{i.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
