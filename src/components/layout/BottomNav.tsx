'use client'
import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems, adminNavItem } from './navItems'

/** Small pulsing bar under the tapped tab while its route loads (instant feedback on slow networks). */
function TabPending() {
  const { pending } = useLinkStatus()
  return <span aria-hidden="true" className={`mt-0.5 h-0.5 w-6 rounded-full ${pending ? 'bg-accent-purple animate-pulse' : 'bg-transparent'}`} />
}

/** Mobile app-style tab bar. */
export default function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  // Help lives in the top bar/footer on mobile so the tab bar keeps 6 (7 for admins) tabs.
  const items = (isAdmin ? [...navItems, adminNavItem] : [...navItems]).filter((i) => i.href !== '/help')
  const pathname = usePathname()
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur safe-bottom" aria-label="Tab bar">
      <ul className={`grid ${isAdmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
        {items.map((i) => {
          const active = pathname.startsWith(i.href)
          return (
            <li key={i.href}>
              <Link href={i.href} aria-current={active ? 'page' : undefined} className={`flex flex-col items-center py-2 ${isAdmin ? 'text-[11px]' : 'text-xs'} ${active ? 'text-accent-purple' : 'text-text-secondary'}`}>
                <span className="text-xl" aria-hidden="true">{i.emoji}</span>
                <span className="max-w-full truncate px-0.5">{i.label}</span>
                <TabPending />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
