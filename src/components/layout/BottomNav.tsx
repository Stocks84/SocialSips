'use client'
import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems, adminNavItem, isNavActive, type NavItem } from './navItems'
import { Icon } from '@/components/ui/Icon'

/** Small bar under the tapped tab while its route loads (opacity pulse; static under reduced motion). */
function TabPending() {
  const { pending } = useLinkStatus()
  return <span aria-hidden="true" className={`mt-0.5 h-0.5 w-5 ${pending ? 'bg-ink-3 animate-tab-pending' : 'bg-transparent'}`} />
}

/** Mobile app-style tab bar (below 1024px). */
export default function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  // Help sits in the legal footer row (and the desktop top nav) so the tab bar keeps 7 (8 for admins) tabs.
  const items: NavItem[] = (isAdmin ? [...navItems, adminNavItem] : [...navItems]).filter((i) => i.href !== '/help')
  const pathname = usePathname()
  const hrefs = items.map((i) => i.href)
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-rule bg-surface safe-bottom" aria-label="Tab bar">
      <ul className={`grid ${isAdmin ? 'grid-cols-8' : 'grid-cols-7'}`}>
        {items.map((i) => {
          const active = isNavActive(pathname, i.href, hrefs)
          return (
            <li key={i.href} className="min-w-0">
              <Link
                href={i.href}
                aria-current={active ? 'page' : undefined}
                title={i.tabLabel ?? i.label}
                className={`relative flex h-14 flex-col items-center justify-center gap-1 min-w-0 font-semibold text-tab ${active ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
              >
                {active && <span aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-5 bg-accent" />}
                <Icon icon={i.icon} className="text-icon-lg" />
                <span className="max-w-full truncate px-0.5">{i.tabLabel ?? i.label}</span>
                <TabPending />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
