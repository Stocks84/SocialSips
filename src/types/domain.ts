/**
 * Hand-maintained domain constants / UI labels.
 * DB row shapes live in src/types/supabase.ts (generated).
 */

export const HANGOVER_RATINGS = ['no_hangover', 'mild_hangover', 'two_day_hangover'] as const
export type HangoverRating = (typeof HANGOVER_RATINGS)[number]

export const HANGOVER_LABELS: Record<HangoverRating, { label: string; emoji: string; badge: string }> = {
  no_hangover: { label: 'No Hangover', emoji: '😇', badge: 'badge-no-hangover' },
  mild_hangover: { label: 'Mild Hangover', emoji: '🤕', badge: 'badge-mild' },
  two_day_hangover: { label: 'Two-Day Hangover', emoji: '💀', badge: 'badge-two-day' },
}
