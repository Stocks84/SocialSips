'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/** Back link to /play plus a full-screen toggle (hidden where the browser can't do it, e.g. iPhone Safari). */
export default function PlayToolbar() {
  const [canFullscreen, setCanFullscreen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled))
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else document.documentElement.requestFullscreen().catch(() => {})
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <Link href="/play" className="btn-ghost text-sm -ml-3">← Play</Link>
      {canFullscreen && (
        <button type="button" onClick={toggle} className="btn-ghost text-sm" aria-pressed={isFullscreen}>
          {isFullscreen ? '↙ Exit full screen' : '⛶ Full screen'}
        </button>
      )}
    </div>
  )
}
