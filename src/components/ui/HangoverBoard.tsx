import { HANGOVER_LABELS, HANGOVER_RATINGS } from '@/types/database'
import { HangoverPips } from './HangoverBadge'

const JOKES: Record<(typeof HANGOVER_RATINGS)[number], string> = {
  no_hangover: "You'll be fine. Probably.",
  mild_hangover: 'Painkillers recommended.',
  two_day_hangover: 'Cancel your plans. All of them.',
}

/**
 * The hangover scale as a pub menu board. Pips are decorative; each row reads "label, joke".
 * `size="full"` grows at ≥1024 (landing); `compact` keeps mobile sizes (sign-in teaser).
 * `reveal` staggers the rows in on landing ≥1024 (motion M2, no-preference only).
 */
export default function HangoverBoard({ size = 'full', reveal = false }: { size?: 'full' | 'compact'; reveal?: boolean }) {
  const full = size === 'full'
  return (
    <section aria-labelledby="hangover-scale-title" className={`border border-accent p-1 ${reveal ? 'board-reveal' : ''}`}>
      <div className={`border border-accent bg-surface px-4 pt-4 pb-1 min-[360px]:px-6 min-[360px]:pt-6 min-[360px]:pb-2 ${full ? 'lg:px-8 lg:pt-8 lg:pb-3' : ''}`}>
        <h2
          id="hangover-scale-title"
          className={`board-reveal-item font-display font-normal text-center text-ink text-board-title ${full ? 'lg:text-board-title-lg' : ''}`}
        >
          The hangover scale
        </h2>
        <div className="rule-double mt-3" aria-hidden="true" />
        <ul>
          {HANGOVER_RATINGS.map((r, i) => {
            const h = HANGOVER_LABELS[r]
            return (
              <li
                key={r}
                className={`board-reveal-item py-4 ${i < 2 ? 'border-b border-rule' : ''}`}
                style={{ '--reveal-step': i + 1 } as React.CSSProperties}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-caps font-bold text-board-label ${full ? 'lg:text-board-label-lg' : ''} ${h.textClass}`}>{h.label}</span>
                  <span className="leader" aria-hidden="true" />
                  <HangoverPips rating={r} />
                </div>
                <p className="font-display italic text-joke text-ink-2">{JOKES[r]}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
