'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { faBeerMugEmpty, faMartiniGlassCitrus, faTrophy, faUser, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'
import { WELCOME_LINKS, WELCOME_PROFILE_LINK, readWelcomeDismissed, writeWelcomeDismissed } from '@/lib/welcome'

const ICONS = {
  '/games': faBeerMugEmpty,
  '/games/new': faBeerMugEmpty,
  '/cocktails/new': faMartiniGlassCitrus,
  '/challenge': faTrophy,
  '/settings/profile': faUser,
} as const

/**
 * Dismissible first-visit card. Hidden until the client sees that localStorage
 * has no dismiss flag, so a returning visit on this device does not flash the card.
 */
export default function WelcomePrompt({ showProfile }: { showProfile: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!readWelcomeDismissed()) setVisible(true)
  }, [])

  function dismiss() {
    writeWelcomeDismissed()
    setVisible(false)
  }

  if (!visible) return null

  const links = showProfile ? [...WELCOME_LINKS, WELCOME_PROFILE_LINK] : WELCOME_LINKS

  return (
    <section className="card mb-6 p-4" data-testid="welcome-prompt" aria-labelledby="welcome-title">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="welcome-title" className="font-semibold text-ink">You&apos;re in. Don&apos;t just stand at the bar.</h2>
          <p className="mt-1 text-sm text-ink-2">A short first round:</p>
        </div>
        <button
          type="button"
          className="btn-icon shrink-0"
          aria-label="Dismiss welcome"
          data-testid="welcome-dismiss"
          onClick={dismiss}
        >
          <Icon icon={faXmark} className="text-icon-md" />
        </button>
      </div>
      <ul className="mt-3 flex flex-col">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              data-testid={l.testId}
              onClick={dismiss}
              className="flex min-h-11 items-center gap-3 rounded-sm px-1 text-sm font-medium text-ink hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <Icon icon={ICONS[l.href]} className="text-icon-md text-ink-2" />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
