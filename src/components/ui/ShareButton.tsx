'use client'
import { useEffect, useRef, useState } from 'react'
import { absoluteShareUrl } from '@/lib/share-url'
import { siteUrl } from '@/lib/site-url'

/**
 * Share this Game, Drink or Dare. Uses the Web Share API when the browser
 * has it; otherwise copies the trusted site URL and shows “Link copied”.
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
    <span className="relative inline-flex min-h-11 items-center">
      <button
        type="button"
        onClick={() => void share()}
        className="inline-flex min-h-11 items-center text-sm text-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        data-testid="share-button"
        aria-label={`Share ${title}`}
      >
        Share
      </button>
      {copied && (
        <span
          className="absolute left-0 top-full z-20 mt-1 whitespace-nowrap rounded-sm border border-rule bg-surface px-3 py-2 text-xs text-accent"
          role="status"
          data-testid="share-copied"
        >
          Link copied
        </span>
      )}
    </span>
  )
}
