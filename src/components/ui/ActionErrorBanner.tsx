'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const PARAM = 'actionError' // keep in sync with ACTION_ERROR_PARAM in lib/server/action-error.ts

/**
 * Shows the error a plain server-action form reported via ?actionError=… (see failBack()).
 * The message is copied into state and the param removed from the URL, so a refresh or share
 * doesn't show it again. Rendered as text only (never HTML).
 */
export default function ActionErrorBanner() {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const fromUrl = params.get(PARAM)

  useEffect(() => {
    if (!fromUrl) return
    setMessage(fromUrl.slice(0, 200))
    const next = new URLSearchParams(params.toString())
    next.delete(PARAM)
    const qs = next.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [fromUrl, params, pathname, router])

  if (!message) return null
  return (
    <div role="alert" className="card mb-6 flex items-start justify-between gap-3 border-danger p-4 text-sm text-danger" data-testid="action-error">
      <span>{message}</span>
      <button type="button" onClick={() => setMessage(null)} className="shrink-0 text-ink-2 hover:text-ink" aria-label="Dismiss error">✕</button>
    </div>
  )
}
