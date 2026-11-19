'use client'
import { useEffect, useRef, useState } from 'react'
import { absoluteShareUrl } from '@/lib/share-url'
import { siteUrl } from '@/lib/site-url'

/**
 * Share this Game, Drink or Dare. Uses the Web Share API when the browser
 * has it; otherwise copies the trusted site URL and swaps the label to
 * “Copied ✓” in place, so nothing overlaps or shifts.
 */
export default function ShareButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  async function share() {
    const url = absoluteShareUrl(path, siteUrl())
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      return
    }
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className="inline-flex min-h-11 items-center">
      <button
        type="button"
        onClick={() => void share()}
        className="inline-flex min-h-11 items-center text-sm text-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        data-testid="share-button"
        aria-label={`Share ${title}`}
      >
        {/* Reserve the wider “Copied ✓” width so Report does not shift. */}
        <span className="grid justify-items-end" aria-hidden="true">
          <span className={`col-start-1 row-start-1 ${copied ? 'invisible' : ''}`}>Share</span>
          <span className={`col-start-1 row-start-1 ${copied ? 'text-accent' : 'invisible'}`} data-testid="share-copied">
            Copied ✓
          </span>
        </span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Link copied' : ''}
      </span>
    </span>
  )
}
