'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  AGE_COOKIE, AGE_COOKIE_MAX_AGE, AGE_DENIED_COOKIE, AGE_DENIED_MAX_AGE, ageCookieOptions, ageFromDob, MIN_AGE,
} from '@/lib/age'
import { safePath } from '@/lib/safe-path'
import { signAgeToken } from '@/lib/age-token'

export type AgeGateState = { error?: string }

/** Server-side age check: validates the DOB and sets an httpOnly cookie (JS can't set or read it). */
export async function verifyAge(_prev: AgeGateState, formData: FormData): Promise<AgeGateState> {
  const dob = String(formData.get('dob') ?? '')
  const age = ageFromDob(dob)
  if (!Number.isFinite(age) || age > 120 || age < 0) return { error: 'Enter a valid date' }

  const jar = await cookies()
  // Under-18 answer in the last 24h: no retry with another date (the action can be POSTed from any page).
  if (jar.get(AGE_DENIED_COOKIE)?.value === '1') redirect('/age-gate/sorry')
  if (age < MIN_AGE) {
    jar.delete(AGE_COOKIE)
    jar.set(AGE_DENIED_COOKIE, '1', ageCookieOptions(AGE_DENIED_MAX_AGE))
    redirect('/age-gate/sorry')
  }

  const token = await signAgeToken(AGE_COOKIE_MAX_AGE)
  jar.set(AGE_COOKIE, token ?? 'true', ageCookieOptions(AGE_COOKIE_MAX_AGE))
  redirect(safePath(formData.get('redirectTo')))
}
