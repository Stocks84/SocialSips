'use client'
import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { faBeerMugEmpty, faMartiniGlassCitrus, faPlus } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

const OPTIONS = [
  { href: '/games/new', label: 'Add a game', icon: faBeerMugEmpty, testId: 'nav-add-game' },
  { href: '/cocktails/new', label: 'Add a drink', icon: faMartiniGlassCitrus, testId: 'nav-add-drink' },
] as const

/**
 * The nav "Add" control: a menu to choose Add a game or Add a drink.
 * Used in the desktop top nav and the mobile tab bar (both stay in the DOM; `variant` matches each).
 */
export default function AddNavButton({ variant, active, compactLabel = false }: { variant: 'tab' | 'link'; active: boolean; compactLabel?: boolean }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const pathname = usePathname()
  const menuId = useId()

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    itemRefs.current[0]?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        buttonRef.current?.focus()
        return
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return
      e.preventDefault()
      const items = itemRefs.current.filter(Boolean) as HTMLAnchorElement[]
      const i = items.indexOf(document.activeElement as HTMLAnchorElement)
      let next = 0
      if (e.key === 'ArrowDown') next = i < 0 ? 0 : (i + 1) % items.length
      if (e.key === 'ArrowUp') next = i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length
      if (e.key === 'Home') next = 0
      if (e.key === 'End') next = items.length - 1
      items[next]?.focus()
    }
    function onPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const menu = open ? (
    <div
      id={menuId}
      role="menu"
      aria-label="Add"
      data-testid="nav-add-menu"
      className={
        variant === 'tab'
          ? 'absolute bottom-full left-1/2 z-50 mb-2 w-56 max-w-[calc(100vw-1rem)] -translate-x-1/2 card p-1'
          : 'absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 card p-1'
      }
    >
      {OPTIONS.map((o, i) => (
        <Link
          key={o.href}
          role="menuitem"
          href={o.href}
          ref={(el) => { itemRefs.current[i] = el }}
          data-testid={o.testId}
          className="flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm font-medium text-ink hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Icon icon={o.icon} className="text-icon-md text-ink-2" />
          {o.label}
        </Link>
      ))}
    </div>
  ) : null

  const toggle = () => setOpen((v) => !v)

  if (variant === 'tab') {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          ref={buttonRef}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-current={active ? 'page' : undefined}
          data-testid="nav-add"
          title="Add"
          className={`relative flex h-14 w-full flex-col items-center justify-center gap-1 min-w-0 font-semibold text-tab ${active ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
          onClick={toggle}
        >
          {active && <span aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-5 bg-accent" />}
          <span className="relative">
            <Icon icon={faPlus} className="text-icon-lg" />
          </span>
          <span
            data-testid="tab-label"
            className={compactLabel ? 'max-w-full whitespace-nowrap tracking-tight' : 'max-w-full truncate px-0.5'}
          >Add</span>
          {/* Same slot as TabPending on the other tabs, so the icon and label share their baseline. */}
          <span aria-hidden="true" className="mt-0.5 h-0.5 w-5 bg-transparent" />
        </button>
        {menu}
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative flex self-stretch items-stretch">
      <button
        type="button"
        ref={buttonRef}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-current={active ? 'page' : undefined}
        data-testid="nav-add"
        className={`relative inline-flex min-h-11 min-w-11 items-center justify-center text-[15px] leading-6 font-medium ${active ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
        onClick={toggle}
      >
        Add
        {active && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
      </button>
      {menu}
    </div>
  )
}
