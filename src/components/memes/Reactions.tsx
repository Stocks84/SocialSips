'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { setReaction } from '@/app/(main)/memes/actions'
import { REACTIONS, reactionTarget, settleReaction, type ReactionReply } from '@/lib/memes'

type State = { counts: Record<string, number>; mine: string | null }
type Props = { memeId: string; counts: Record<string, number>; mine: string | null; signedIn: boolean; disabled?: boolean; suspended?: boolean; path: string }

/** 😂 🔥 🍸 💀 👏 with counts. One reaction per person: tap to set, tap another to change, tap yours to remove. */
export default function Reactions({ memeId, counts, mine, signedIn, disabled = false, suspended = false, path }: Props) {
  // Counts only ever come from the server, so a rejected reaction never shows a wrong number.
  // The tapped button lights up straight away (pending) so a tap still feels instant.
  const [state, setState] = useState<State>({ counts, mine })
  const [pending, setPending] = useState<{ emoji: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Each tap gets a sequence number; only the newest reply is rendered, so out-of-order replies can't win.
  const seq = useRef(0)

  async function react(emoji: string) {
    if (!signedIn || disabled || suspended) return
    const shown = pending ? pending.emoji : state.mine
    const next = reactionTarget(shown, emoji)
    const mySeq = ++seq.current
    setError(null)
    setPending({ emoji: next })
    let reply: ReactionReply
    try {
      reply = await setReaction(memeId, next)
    } catch {
      reply = { error: 'Could not save your reaction. Check your connection and try again.' }
    }
    const r = settleReaction(reply, mySeq !== seq.current)
    if (r.ignore) return
    setPending(null)
    if (r.error) setError(r.error)
    else if (r.view) setState(r.view)
  }

  return (
    <div data-testid="reactions" aria-busy={pending !== null}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Reactions">
        {REACTIONS.map((e) => {
          const n = state.counts[e] ?? 0
          const active = (pending ? pending.emoji : state.mine) === e
          return (
            <button
              key={e}
              type="button"
              onClick={() => react(e)}
              disabled={!signedIn || disabled || suspended}
              aria-pressed={active}
              aria-label={`${e} ${n}`}
              data-testid="reaction"
              className={`inline-flex min-h-11 min-w-11 items-center justify-center px-2.5 rounded-sm text-sm border transition-colors ${active ? 'border-accent bg-raised' : 'border-line hover:border-accent'} disabled:cursor-default ${pending && active ? 'opacity-70' : ''}`}
            >
              {e} <span className="text-ink-2 text-xs">{n}</span>
            </button>
          )
        })}
      </div>
      {!signedIn && <p className="text-ink-3 text-xs mt-2"><Link href={`/sign-in?redirectTo=${path}`} className="text-accent">Sign in</Link> to react.</p>}
      {suspended && <p className="text-ink-3 text-xs mt-2" data-testid="reactions-suspended">Reactions are paused while your account is suspended.</p>}
      {error && <p className="error-msg text-xs mt-2" role="alert">{error}</p>}
    </div>
  )
}
