import 'server-only'
import { moderationAlertEmailEnabled, reportNoun } from '@/lib/moderation-alert'

export type ModerationAlertInput = { targetType: string }

/**
 * Optional email to the moderator when a new report is filed.
 * No-ops unless MODERATION_ALERT_EMAIL_ENABLED=true and Resend is configured.
 * Never throws; never logs addresses or keys.
 */
export async function maybeSendModerationAlertEmail(input: ModerationAlertInput): Promise<void> {
  if (!moderationAlertEmailEnabled()) return
  const to = process.env.MODERATION_ALERT_EMAIL
  const from = process.env.MODERATION_ALERT_FROM
  const key = process.env.RESEND_API_KEY
  if (!to || !from || !key) return
  const noun = reportNoun(input.targetType)
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://social-sips-livid.vercel.app'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `New report on ${noun}`,
        text: `There's a new report on ${noun} waiting in the admin queue:\n${origin}/admin/reports\n`,
      }),
    })
    if (!res.ok) console.error('moderation alert email failed', res.status)
  } catch {
    console.error('moderation alert email failed')
  }
}
