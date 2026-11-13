/**
 * Hand-maintained domain constants / UI labels.
 * DB row shapes live in src/types/supabase.ts (generated).
 */

export const HANGOVER_RATINGS = ['no_hangover', 'mild_hangover', 'two_day_hangover'] as const
export type HangoverRating = (typeof HANGOVER_RATINGS)[number]

/** `emoji` is kept as data only; the UI no longer renders it. `pips` and `textClass` drive the hangover meter. */
export const HANGOVER_LABELS: Record<HangoverRating, { label: string; emoji: string; pips: 1 | 2 | 3; textClass: string; pipClass: string }> = {
  no_hangover: { label: 'No Hangover', emoji: '😇', pips: 1, textClass: 'text-hangover-none', pipClass: 'bg-hangover-none' },
  mild_hangover: { label: 'Mild Hangover', emoji: '🤕', pips: 2, textClass: 'text-hangover-mild', pipClass: 'bg-hangover-mild' },
  two_day_hangover: { label: 'Two-Day Hangover', emoji: '💀', pips: 3, textClass: 'text-hangover-heavy', pipClass: 'bg-hangover-heavy' },
}
