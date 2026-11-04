import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { safePath } from '@/lib/safe-path'

/** Query param read by <ActionErrorBanner/> in the (main) layout. Not "error": some pages already use that. */
export const ACTION_ERROR_PARAM = 'actionError'

/**
 * For plain `<form action={fn}>` server actions (no useActionState): send the user back to the page
 * they submitted from with a visible, dismissible error instead of failing silently.
 * The page comes from the same-origin Referer (server actions POST to the current URL), else `fallback`.
 */
export async function failBack(message: string | undefined, fallback = '/feed'): Promise<never> {
  const h = await headers()
  let back = safePath(fallback)
  const ref = h.get('referer')
  if (ref) {
    try {
      const u = new URL(ref)
      if (u.host === h.get('host')) back = safePath(`${u.pathname}${u.search}`, back)
    } catch { /* ignore malformed referer */ }
  }
  const u = new URL(back, 'https://safe.invalid')
  u.searchParams.set(ACTION_ERROR_PARAM, (message || 'Something went wrong. Please try again.').slice(0, 200))
  redirect(`${u.pathname}${u.search}`)
}
