/** Copy and guards for admin report alerts. No I/O, safe to unit-test. */

export const REPORT_NOUN: Record<string, string> = {
  game: 'a game',
  comment: 'a comment',
  variation: 'a game variation',
  cocktail: 'a drink',
  cocktail_variation: 'a drink variation',
  meme: 'a meme',
  link: 'a link',
}

/** Short noun phrase for a report target, using Drinks (never Cocktails). */
export function reportNoun(targetType: string): string {
  return REPORT_NOUN[targetType] ?? 'a post'
}

export function openReportsLabel(count: number): string {
  if (count <= 0) return 'No open reports'
  if (count === 1) return '1 open report'
  return `${count} open reports`
}

/**
 * Email is off unless this returns true. Requires an explicit flag so a Resend key
 * used for something else later cannot start mailing by accident.
 */
export function moderationAlertEmailEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.MODERATION_ALERT_EMAIL_ENABLED === 'true'
    && Boolean(env.MODERATION_ALERT_EMAIL?.includes('@'))
    && Boolean(env.MODERATION_ALERT_FROM?.includes('@'))
    && Boolean(env.RESEND_API_KEY)
}

/** In-app notification copy for kind=report. Never includes a reporter. */
export function reportNotificationText(preview: string | null | undefined): { icon: string; text: string } {
  return { icon: '🚩', text: preview ? `New report on ${preview}` : 'New report in the queue' }
}

export function reportNotificationHref(reportId: string): string {
  return `/admin/reports#report-${reportId}`
}
