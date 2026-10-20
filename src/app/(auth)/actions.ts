'use server'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { signInSchema, signUpSchema } from '@/lib/validators/auth'
import { REMEMBER_COOKIE, rememberCookieOptions } from '@/lib/supabase/cookies'
import { safePath } from '@/lib/safe-path'
import { LEGAL } from '@/lib/legal'
import { recordFailure, throttleOk } from '@/lib/server/throttle'

/** Stores the "Keep me signed in" choice so token refreshes keep the same cookie lifetime. */
async function setRemember(remember: boolean) {
  ;(await cookies()).set(REMEMBER_COOKIE, remember ? '1' : '0', rememberCookieOptions(remember))
}

export type AuthState = { error?: string; message?: string }

const NOT_CONFIGURED = 'Supabase is not configured. Add .env.local (see README).'

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    username: String(formData.get('username') ?? '').trim().toLowerCase(),
    dateOfBirth: formData.get('dateOfBirth'),
    ageConfirmed: formData.get('ageConfirmed') === 'true',
    termsAccepted: formData.get('termsAccepted') === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check your details' }

  // Sign-up defaults to "keep me signed in"
  const supabase = await createClient({ remember: true })
  if (!supabase) return { error: NOT_CONFIGURED }

  const { email, password, username, dateOfBirth } = parsed.data
  const origin = (await headers()).get('origin') ?? ''
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { username, date_of_birth: dateOfBirth, age_confirmed: true, accepted_terms_version: LEGAL.termsVersion },
    },
  })
  if (error) {
    const msg = error.message
    if (msg.includes('date_of_birth')) return { error: 'You must be 18 or over to join Social Sips.' }
    if (msg.includes('Age confirmation')) return { error: 'Please confirm you are 18 or over.' }
    if (msg.includes('Terms required')) return { error: 'Please accept the Terms of Use and Privacy Policy.' }
    if (msg.includes('username') || msg.includes('duplicate')) return { error: 'That username is taken.' }
    if (msg.includes('Database error')) return { error: 'Could not create your account. Try another username.' }
    if (/password/i.test(msg)) return { error: 'Password is too weak. Use at least 8 characters.' }
    console.error('signUp', msg)
    return { error: 'Could not create your account. Please try again.' }
  }
  await setRemember(true)
  if (!data.session) return { message: 'Check your email to confirm your account 📬' }
  redirect('/feed')
}

const SIGN_IN_FAILED = 'Email or password is incorrect.'
const THROTTLED = 'Too many sign-in attempts. Please wait 15 minutes and try again.'

/** Client IP as seen by Vercel (first x-forwarded-for hop), for the sign-in throttle. */
async function clientIp() {
  const h = await headers()
  return (h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0] ?? 'unknown').trim().slice(0, 64)
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { error: 'Enter your email and password' }
  const remember = formData.get('remember') === '1'
  const supabase = await createClient({ remember })
  if (!supabase) return { error: NOT_CONFIGURED }
  // DB-backed throttle (works across serverless instances): failures per IP and per (email, IP) pair,
  // so nobody can lock a victim's email out from their own IP.
  const ip = await clientIp()
  const keys = [`ip:${ip}`, `email-ip:${parsed.data.email.trim().toLowerCase()}|${ip}`]
  if (!(await throttleOk(supabase, keys))) return { error: THROTTLED }
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    if (error.code === 'email_not_confirmed') return { error: 'Please confirm your email first. Check your inbox 📬' }
    if (error.status === 429) return { error: THROTTLED }
    await recordFailure(supabase, keys)
    return { error: SIGN_IN_FAILED }
  }
  await setRemember(remember)
  const dest = safePath(formData.get('redirectTo'))
  // A server-action redirect renders the target in this same request (no middleware run), so check
  // the Terms version here too; the middleware covers every later request.
  const { data: accepted } = await supabase.rpc('my_terms_version')
  if (accepted !== LEGAL.termsVersion) redirect(`/accept-terms?next=${encodeURIComponent(dest)}`)
  redirect(dest)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase?.auth.signOut()
  ;(await cookies()).delete(REMEMBER_COOKIE)
  redirect('/')
}
