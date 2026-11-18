/** Live length / count hint. Turns green with a check when the rule is met. */
export default function LengthHint({
  id, value, count, min, max, unit = 'character', hint, met, invalid,
}: {
  id: string
  value?: string
  count?: number
  min?: number
  max?: number
  unit?: 'character' | 'ingredient' | 'item'
  hint?: string
  met?: boolean
  invalid?: boolean
}) {
  const n = count ?? (value ?? '').trim().length
  const ok = met ?? (min != null && n >= min && (max == null || n <= max))
  const text = hint ?? defaultHint(min ?? 0, unit)
  const colour = ok ? 'text-success' : invalid ? 'text-danger' : 'text-ink-3'
  return (
    <p id={`${id}-hint`} className={`${colour} text-xs mt-1 flex justify-between gap-3`} data-testid={`${id}-hint`} data-met={ok ? 'true' : 'false'}>
      <span>{ok ? `✓ ${text}` : text}</span>
      {max != null && <span className="tabular-nums shrink-0">{n}/{max}</span>}
    </p>
  )
}

export function defaultHint(min: number, unit: 'character' | 'ingredient' | 'item' = 'character') {
  if (unit === 'ingredient') return min === 1 ? 'Add at least one ingredient' : `Add at least ${min} ingredients`
  if (unit === 'item') return `Up to ${min} items, comma separated`
  return `At least ${min} ${min === 1 ? 'character' : 'characters'}`
}

/** Skip a field error that already appears in the hint or the top summary. */
export function uniqueFieldError(message: string | undefined, hint?: string, topError?: string) {
  if (!message) return undefined
  if (hint && (message === hint || hint.endsWith(message))) return undefined
  if (topError && (topError === message || topError.endsWith(`: ${message}`))) return undefined
  return message
}
