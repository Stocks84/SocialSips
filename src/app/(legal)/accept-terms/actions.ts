'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/server/auth'
import { LEGAL } from '@/lib/legal'
import { signTermsToken, TERMS_COOKIE, termsCookieOptions } from '@/lib/terms-token'

export type AcceptState = { error?: string }
const safeNext = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '')
  return s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/accept-terms') ? s : '/feed'
}

/** Records acceptance of the current version (server function; the columns aren't writable by users). */
export async function acceptTerms(_prev: AcceptState, formData: FormData): Promise<AcceptState> {
  if (formData.get('accept') !== 'true') return { error: 'Please tick the box to accept the Terms of Use and Privacy Policy.' }
  const auth = await requireUser()
  if ('error' in auth) redirect('/sign-in')
  const { error } = await auth.supabase.rpc('accept_terms', { p_version: LEGAL.termsVersion })
  if (error) { console.error('accept_terms', error.message); return { error: 'We couldn’t save that. Please try again.' } }
  const token = await signTermsToken(auth.user.id, LEGAL.termsVersion)
  if (token) (await cookies()).set(TERMS_COOKIE, token, termsCookieOptions)
  redirect(safeNext(formData.get('next')))
}
