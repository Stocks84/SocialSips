'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import CountBadge from '@/components/ui/CountBadge'
import { openReportsLabel } from '@/lib/moderation-alert'

const TABS = [
  { key: 'reports', href: '/admin/reports', label: 'Reports' },
  { key: 'hidden', href: '/admin/hidden', label: 'Hidden items' },
  { key: 'users', href: '/admin/users', label: 'Accounts', testId: 'admin-users-link' },
  { key: 'challenges', href: '/admin/challenges', label: 'Challenges', testId: 'admin-challenges-link' },
] as const

export type AdminTabKey = (typeof TABS)[number]['key']

/**
 * Section tabs for the admin pages. One row that scrolls sideways on narrow screens (no page overflow, no wrapping),
 * 44px-tall tap targets, brass underline + bright text on the active tab. The active tab is scrolled into view on load,
 * so on a phone it is never hidden off the edge. Only rendered by admin pages (non-admins get a 404 before this).
 */
export default function AdminTabs({ active, openReports = 0 }: { active: AdminTabKey; openReports?: number }) {
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const nav = navRef.current
    const el = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!nav || !el) return
    // Centre the active tab inside the row (row scroll only; never moves the page).
    nav.scrollLeft = Math.max(0, el.offsetLeft - (nav.clientWidth - el.offsetWidth) / 2)
  }, [active])
  return (
    <nav
      ref={navRef}
      aria-label="Admin sections"
      className="mb-6 overflow-x-auto overscroll-x-contain border-b border-rule [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-testid="admin-tabs"
    >
      <ul className="relative flex w-max min-w-full gap-1">
        {TABS.map((t) => {
          const isActive = t.key === active
          return (
            <li key={t.key} className="shrink-0">
              <Link
                href={t.href}
                aria-current={isActive ? 'page' : undefined}
                data-testid={'testId' in t ? t.testId : undefined}
                aria-label={t.key === 'reports' && openReports > 0 ? `Reports, ${openReportsLabel(openReports)}` : undefined}
                className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm font-semibold ${
                  isActive ? 'border-accent text-ink' : 'border-transparent text-ink-2 hover:text-ink hover:bg-raised'
                }`}
              >
                {t.label}
                {t.key === 'reports' && <CountBadge count={openReports} testId="admin-tab-report-count" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
