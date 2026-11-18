'use client'
import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems, adminNavItem, isNavActive, navHrefsForActive, type NavItem } from './navItems'
import AddNavButton from './AddNavButton'
import { Icon } from '@/components/ui/Icon'
import CountBadge from '@/components/ui/CountBadge'
import { openReportsLabel } from '@/lib/moderation-alert'

/** Small bar under the tapped tab while its route loads (opacity pulse; static under reduced motion). */
function TabPending() {
  const { pending } = useLinkStatus()
  return <span aria-hidden="true" className={`mt-0.5 h-0.5 w-5 ${pending ? 'bg-ink-3 animate-tab-pending' : 'bg-transparent'}`} />
}

/** Mobile app-style tab bar (below 1024px). */
export default function BottomNav({ isAdmin = false, openReports = 0 }: { isAdmin?: boolean; openReports?: number }) {
  // Help sits in the legal footer row (and the desktop top nav) so the tab bar keeps 7 items for everyone,
  // or 8 when the Admin tab is included. Admin labels drop the extra padding and use tighter tracking so
  // “Memes” and the others still read in full at 360px; the non-admin 7-tab bar is left as it is.
  const items: NavItem[] = (isAdmin ? [...navItems, adminNavItem] : [...navItems]).filter((i) => i.href !== '/help')
  const pathname = usePathname()
  const hrefs = navHrefsForActive(items.map((i) => i.href))
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-rule bg-surface safe-bottom" aria-label="Tab bar">
      <ul className={`grid ${isAdmin ? 'grid-cols-8' : 'grid-cols-7'}`}>
        {items.map((i) => {
          const active = isNavActive(pathname, i.href, hrefs)
          return (
            <li key={i.href} className="min-w-0">
              {i.href === '/games/new' ? (
                <AddNavButton variant="tab" active={active} compactLabel={isAdmin} />
              ) : (
                <Link
                  href={i.href}
                  aria-current={active ? 'page' : undefined}
                  title={i.tabLabel ?? i.label}
                  aria-label={i.href === '/admin' && openReports > 0 ? `Admin, ${openReportsLabel(openReports)}` : undefined}
                  data-testid={i.href === '/admin' ? 'nav-admin' : undefined}
                  className={`relative flex h-14 flex-col items-center justify-center gap-1 min-w-0 font-semibold text-tab ${active ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
                >
                  {active && <span aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-5 bg-accent" />}
                  <span className="relative">
                    <Icon icon={i.icon} className="text-icon-lg" />
                    {i.href === '/admin' && (
                      <CountBadge
                        count={openReports}
                        testId="admin-report-count"
                        className="absolute -right-1.5 -top-1"
                      />
                    )}
                  </span>
                  <span
                    data-testid="tab-label"
                    className={isAdmin ? 'max-w-full whitespace-nowrap tracking-tight' : 'max-w-full truncate px-0.5'}
                  >{i.tabLabel ?? i.label}</span>
                  <TabPending />
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
