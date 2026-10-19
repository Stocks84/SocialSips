'use client'
import { useEffect, useState } from 'react'

const fmt = (ms: number) => {
  if (ms <= 0) return 'Voting closed'
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return `${d ? `${d}d ` : ''}${h}h ${m}m ${d ? '' : `${sec}s`}`.trim() + ' left'
}

/** Live countdown to the challenge end (server renders the first value, so no layout jump). */
export default function Countdown({ endsAt, initialNow }: { endsAt: string; initialNow: number }) {
  const end = new Date(endsAt).getTime()
  const [now, setNow] = useState(initialNow)
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  return <span className="font-mono" data-testid="countdown" suppressHydrationWarning>⏳ {fmt(end - now)}</span>
}
