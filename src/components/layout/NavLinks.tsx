'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isNavActive, type NavItem } from './navItems'

/** Desktop (≥1024) text-only nav links with the same active-state rules as the mobile tab bar. */
export default function NavLinks({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname()
  const hrefs = items.map((i) => i.href)
  return (
    <div className="hidden lg:flex self-stretch items-stretch gap-5 flex-wrap justify-end">
      {items.map((i) => {
        const active = isNavActive(pathname, i.href, hrefs)
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? 'page' : undefined}
            className={`relative inline-flex items-center text-[15px] leading-6 font-medium ${active ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
          >
            {i.label}
            {active && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
          </Link>
        )
      })}
    </div>
  )
}
