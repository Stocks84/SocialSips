'use client'
import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems, adminNavItem, isNavActive } from './navItems'

/** Small pulsing bar under the tapped tab while its route loads (instant feedback on slow networks). */
function TabPending() {
  const { pending } = useLinkStatus()
  return <span aria-hidden="true" className={`mt-0.5 h-0.5 w-5 rounded-full ${pending ? 'bg-accent-purple animate-pulse' : 'bg-transparent'}`} />
}

/** Mobile app-style tab bar. */
export default function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  // Help lives in the top bar/footer on mobile so the tab bar keeps 7 (8 for admins) tabs.
  const items = (isAdmin ? [...navItems, adminNavItem] : [...navItems]).filter((i) => i.href !== '/help')
  const pathname = usePathname()
  const hrefs = items.map((i) => i.href)
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur safe-bottom" aria-label="Tab bar">
      <ul className={`grid ${isAdmin ? 'grid-cols-8' : 'grid-cols-7'}`}>
        {items.map((i) => {
          const active = isNavActive(pathname, i.href, hrefs)
          return (
            <li key={i.href} className="min-w-0">
              <Link href={i.href} aria-current={active ? 'page' : undefined} title={i.label} className={`flex flex-col items-center justify-center min-w-0 py-1.5 leading-tight tracking-tighter ${isAdmin ? 'text-[9px]' : 'text-[10px]'} ${active ? 'text-accent-purple' : 'text-text-secondary'}`}>
                <span className={isAdmin ? 'text-lg' : 'text-xl'} aria-hidden="true">{i.emoji}</span>
                <span className="max-w-full truncate">{i.label}</span>
                <TabPending />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
