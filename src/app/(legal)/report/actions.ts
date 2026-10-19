'use server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { recordFailure, throttleOk } from '@/lib/server/throttle'
import { publicReportSchema } from '@/lib/validators/comment'
import { fieldErrors, formValues, type EditState } from '@/lib/validators/issues'

const UUID_RE = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const PATHS: [RegExp, 'meme' | 'game' | 'cocktail'][] = [
  [new RegExp(`^/memes/(${UUID_RE})(?:/|$)`, 'i'), 'meme'],
  [new RegExp(`^/games/(${UUID_RE})(?:/|$)`, 'i'), 'game'],
  [new RegExp(`^/cocktails/(${UUID_RE})(?:/|$)`, 'i'), 'cocktail'],
]

/** A pasted Social Sips link to a meme/game/cocktail becomes an exact target; anything else stays a link. */
function targetFromUrl(raw: string, host: string | null) {
  try {
    const u = new URL(raw, `https://${host ?? 'localhost'}`)
    if (host && u.host !== host) return null
    for (const [re, type] of PATHS) { const m = re.exec(u.pathname); if (m) return { type, id: m[1].toLowerCase() } }
  } catch { /* not a URL: keep as text */ }
  return null
}

async function clientIp() {
  const h = await headers()
  return (h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0] ?? 'unknown').trim().slice(0, 64)
}

/** Notice-and-action form (DSA Art. 16) for anyone, signed in or not. Max 10 reports per IP per 15 minutes. */
export async function submitPublicReport(_prev: EditState, formData: FormData): Promise<EditState> {
  const str = (k: string) => { const v = formData.get(k); return typeof v === 'string' && v.trim() ? v : undefined }
  const parsed = publicReportSchema.safeParse({
    targetType: str('targetType'), targetId: str('targetId'), url: str('url'), reason: str('reason'),
    note: String(formData.get('note') ?? ''), email: String(formData.get('email') ?? ''), goodFaith: formData.get('goodFaith') === 'true',
  })
  const fail = (error: string, fields?: Record<string, string>): EditState => ({ error, fieldErrors: fields, values: formValues(formData) })
  if (!parsed.success) return fail('Check the form', fieldErrors(parsed.error.issues))
  const r = parsed.data
  const supabase = await createClient()
  const secret = process.env.AUTH_THROTTLE_SECRET
  if (!supabase || !secret) return fail('Reporting is unavailable right now. Please email us instead.')

  const keys = [`report-ip:${await clientIp()}`]
  if (!(await throttleOk(supabase, keys))) return fail('You’ve sent a lot of reports. Please wait 15 minutes and try again.')
  await recordFailure(supabase, keys) // counts every report towards the IP limit

  const host = (await headers()).get('host')
  const fromUrl = r.url ? targetFromUrl(r.url, host) : null
  const type = r.targetType && r.targetId ? r.targetType : fromUrl?.type ?? 'link'
  const id = r.targetType && r.targetId ? r.targetId : fromUrl?.id ?? null
  const { error } = await supabase.rpc('submit_public_report', {
    p_secret: secret, p_target_type: type, p_target_id: id, p_target_url: r.url ?? null,
    p_reason: r.reason, p_note: r.note, p_email: r.email || null,
  })
  if (error) {
    console.error('submit_public_report', error.code, error.message)
    return fail('We couldn’t send your report. Please try again, or email us.')
  }
  return { ok: true }
}
