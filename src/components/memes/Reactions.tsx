'use client'
import { useOptimistic, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { setReaction } from '@/app/(main)/memes/actions'
import { REACTIONS } from '@/lib/memes'

type State = { counts: Record<string, number>; mine: string | null }
type Props = { memeId: string; counts: Record<string, number>; mine: string | null; signedIn: boolean; disabled?: boolean; path: string }

/** 😂 🔥 🍸 💀 👏 with counts. One reaction per person: tap to set, tap another to change, tap yours to remove. */
export default function Reactions({ memeId, counts, mine, signedIn, disabled = false, path }: Props) {
  const [state, setState] = useState<State>({ counts, mine })
  const [optimistic, apply] = useOptimistic(state, (s: State, next: string | null): State => {
    const c = { ...s.counts }
    if (s.mine) c[s.mine] = Math.max(0, (c[s.mine] ?? 1) - 1)
    if (next) c[next] = (c[next] ?? 0) + 1
    return { counts: c, mine: next }
  })
  const [, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Each tap gets a sequence number; only the newest reply is rendered, so out-of-order replies can't win.
  const seq = useRef(0)

  function react(emoji: string) {
    if (!signedIn || disabled) return
    const next = optimistic.mine === emoji ? null : emoji
    const mySeq = ++seq.current
    setError(null)
    start(async () => {
      apply(next)
      const res = await setReaction(memeId, next)
      if (mySeq !== seq.current) return
      if (res.error) setError(res.error)
      else setState({ counts: res.counts ?? {}, mine: res.mine ?? null })
    })
  }

  return (
    <div data-testid="reactions">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Reactions">
        {REACTIONS.map((e) => {
          const n = optimistic.counts[e] ?? 0
          const active = optimistic.mine === e
          return (
            <button
              key={e}
              type="button"
              onClick={() => react(e)}
              disabled={!signedIn || disabled}
              aria-pressed={active}
              aria-label={`${e} ${n}`}
              data-testid="reaction"
              className={`px-2.5 py-1 rounded-full text-sm border transition-colors ${active ? 'border-accent-purple bg-accent-purple/20' : 'border-border hover:border-accent-cyan'} disabled:cursor-default`}
            >
              {e} <span className="text-text-secondary text-xs">{n}</span>
            </button>
          )
        })}
      </div>
      {!signedIn && <p className="text-text-muted text-xs mt-2"><Link href={`/sign-in?redirectTo=${path}`} className="text-accent-purple">Sign in</Link> to react.</p>}
      {error && <p className="error-msg text-xs mt-2" role="alert">{error}</p>}
    </div>
  )
}
