'use client'
import { useEffect, useRef } from 'react'
import { TURNSTILE_SITE_KEY } from '@/lib/turnstile'

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window { turnstile?: TurnstileApi; __ssTurnstileLoad?: Promise<TurnstileApi> }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/** Loads the Turnstile script once per page (explicit render; no npm dependency). */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (window.__ssTurnstileLoad) return window.__ssTurnstileLoad
  window.__ssTurnstileLoad = new Promise<TurnstileApi>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')))
    s.onerror = () => { window.__ssTurnstileLoad = undefined; reject(new Error('turnstile failed to load')) }
    document.head.appendChild(s)
  })
  return window.__ssTurnstileLoad
}

/**
 * Renders the Turnstile widget inside a <form>. Turnstile writes its token into a hidden
 * `cf-turnstile-response` input, which the server action reads. Tokens are single-use, so pass a
 * changing `resetKey` (e.g. the action state) to get a fresh token after each submit.
 */
export default function Turnstile({ resetKey, action }: { resetKey?: unknown; action?: string }) {
  const el = useRef<HTMLDivElement>(null)
  const id = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !el.current || id.current) return
        id.current = ts.render(el.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: 'dark',
          size: 'flexible',
          'refresh-expired': 'auto',
        })
      })
      .catch(() => { /* the server action shows a friendly "security check" error */ })
    return () => {
      cancelled = true
      if (id.current && window.turnstile) window.turnstile.remove(id.current)
      id.current = null
    }
  }, [action])

  // Fresh token after every submit (success or failure): the previous one has been used.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (id.current && window.turnstile) window.turnstile.reset(id.current)
  }, [resetKey])

  return <div ref={el} className="min-h-[65px]" data-testid="turnstile" />
}
