'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isNavActive, type NavItem } from './navItems'

/** Desktop nav links with the same active-state rules as the mobile tab bar. */
export default function NavLinks({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname()
  const hrefs = items.map((i) => i.href)
  return (
    <div className="hidden sm:flex items-center gap-0.5 flex-wrap justify-end">
      {items.map((i) => {
        const active = isNavActive(pathname, i.href, hrefs)
        return (
          <Link key={i.href} href={i.href} aria-current={active ? 'page' : undefined} className={`btn-ghost text-sm ${active ? 'text-accent-purple font-semibold' : ''}`}>
            {i.emoji} {i.label}
          </Link>
        )
      })}
    </div>
  )
}
