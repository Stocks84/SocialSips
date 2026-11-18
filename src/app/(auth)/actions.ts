'use server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { signInSchema, signUpSchema } from '@/lib/validators/auth'
import { forgotPasswordSchema, updatePasswordSchema } from '@/lib/validators/password'
import { REMEMBER_COOKIE, rememberCookieOptions } from '@/lib/supabase/cookies'
import { safePath } from '@/lib/safe-path'
import { LEGAL } from '@/lib/legal'
import { recordFailure, throttleOk } from '@/lib/server/throttle'
import { clientIp } from '@/lib/server/request'
import { isPwnedPassword, PWNED_PASSWORD_MESSAGE } from '@/lib/server/pwned'
import { TURNSTILE_FIELD } from '@/lib/turnstile'
import { siteUrl } from '@/lib/site-url'

/** Stores the "Keep me signed in" choice so token refreshes keep the same cookie lifetime. */
async function setRemember(remember: boolean) {
  ;(await cookies()).set(REMEMBER_COOKIE, remember ? '1' : '0', rememberCookieOptions(remember))
}

/** Echoed back on errors so the form keeps what the user typed (never the password). */
export type AuthValues = {
  email?: string; username?: string; dateOfBirth?: string
  remember?: boolean; ageConfirmed?: boolean; termsAccepted?: boolean
}
export type AuthState = { error?: string; message?: string; values?: AuthValues }

const str = (v: FormDataEntryValue | null, max = 320) => (typeof v === 'string' ? v.slice(0, max) : '')

const NOT_CONFIGURED = 'Supabase is not configured. Add .env.local (see README).'

// Cloudflare Turnstile token (Supabase Auth verifies it when CAPTCHA protection is on).
const CAPTCHA_MISSING = 'Please complete the security check, then try again.'
const CAPTCHA_FAILED = 'The security check failed or expired. Please try again.'
const captchaToken = (formData: FormData) => str(formData.get(TURNSTILE_FIELD), 4096)
const isCaptchaError = (e: { code?: string; message: string }) => e.code === 'captcha_failed' || /captcha/i.test(e.message)

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values: AuthValues = {
    email: str(formData.get('email')),
    username: str(formData.get('username'), 40).trim().toLowerCase(),
    dateOfBirth: str(formData.get('dateOfBirth'), 10),
    ageConfirmed: formData.get('ageConfirmed') === 'true',
    termsAccepted: formData.get('termsAccepted') === 'true',
  }
  const fail = (error: string): AuthState => ({ error, values })
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    username: String(formData.get('username') ?? '').trim().toLowerCase(),
    dateOfBirth: formData.get('dateOfBirth'),
    ageConfirmed: formData.get('ageConfirmed') === 'true',
    termsAccepted: formData.get('termsAccepted') === 'true',
  })
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check your details')
  const token = captchaToken(formData)
  if (!token) return fail(CAPTCHA_MISSING)

  // Sign-up defaults to "keep me signed in"
  const supabase = await createClient({ remember: true })
  if (!supabase) return fail(NOT_CONFIGURED)

  const { email, password, username, dateOfBirth } = parsed.data
  // Known-breached passwords are rejected (HIBP k-anonymity; fails open if the API is down).
  if (await isPwnedPassword(password)) return fail(PWNED_PASSWORD_MESSAGE)
  // Trusted site URL from config, never the client's Origin header (open-redirect / phishing via confirm email).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      captchaToken: token,
      emailRedirectTo: `${siteUrl()}/auth/callback`,
      data: { username, date_of_birth: dateOfBirth, age_confirmed: true, accepted_terms_version: LEGAL.termsVersion },
    },
  })
  if (error) {
    if (isCaptchaError(error)) return fail(CAPTCHA_FAILED)
    const msg = error.message
    if (msg.includes('date_of_birth')) return fail('You must be 18 or over to join Social Sips.')
    if (msg.includes('Age confirmation')) return fail('Please confirm you are 18 or over.')
    if (msg.includes('Terms required')) return fail('Please accept the Terms of Use and Privacy Policy.')
    if (msg.includes('username') || msg.includes('duplicate')) return fail('That username is taken.')
    if (msg.includes('Database error')) return fail('Could not create your account. Try another username.')
    if (/password/i.test(msg)) return fail('Password is too weak. Use at least 8 characters.')
    console.error('signUp', msg)
    return fail('Could not create your account. Please try again.')
  }
  await setRemember(true)
  if (!data.session) return { message: 'Check your email to confirm your account 📬' }
  redirect('/feed')
}

const SIGN_IN_FAILED = 'Email or password is incorrect.'
const THROTTLED = 'Too many sign-in attempts. Please wait 15 minutes and try again.'

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values: AuthValues = { email: str(formData.get('email')), remember: formData.get('remember') === '1' }
  const fail = (error: string): AuthState => ({ error, values })
  const parsed = signInSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return fail('Enter your email and password')
  const token = captchaToken(formData)
  if (!token) return fail(CAPTCHA_MISSING)
  const remember = formData.get('remember') === '1'
  const supabase = await createClient({ remember })
  if (!supabase) return fail(NOT_CONFIGURED)
  // DB-backed throttle (works across serverless instances): failures per IP and per (email, IP) pair,
  // so nobody can lock a victim's email out from their own IP.
  const ip = await clientIp()
  const keys = [`ip:${ip}`, `email-ip:${parsed.data.email.trim().toLowerCase()}|${ip}`]
  if (!(await throttleOk(supabase, keys))) return fail(THROTTLED)
  const { error } = await supabase.auth.signInWithPassword({ ...parsed.data, options: { captchaToken: token } })
  if (error) {
    // Not a wrong password, so it doesn't count towards the throttle.
    if (isCaptchaError(error)) return fail(CAPTCHA_FAILED)
    if (error.code === 'email_not_confirmed') return fail('Please confirm your email first. Check your inbox 📬')
    if (error.status === 429) return fail(THROTTLED)
    await recordFailure(supabase, keys)
    return fail(SIGN_IN_FAILED)
  }
  await setRemember(remember)
  const dest = safePath(formData.get('redirectTo'))
  // A server-action redirect renders the target in this same request (no middleware run), so check
  // the Terms version here too; the middleware covers every later request.
  const { data: accepted } = await supabase.rpc('my_terms_version')
  if (accepted !== LEGAL.termsVersion) redirect(`/accept-terms?next=${encodeURIComponent(dest)}`)
  redirect(dest)
}

const RESET_SENT = "If that email has an account, we've sent a reset link."
const RESET_THROTTLED = 'Too many reset attempts. Please wait 15 minutes and try again.'
const RESET_EXPIRED = 'That reset link is invalid or has expired. Please request a new one.'

/** Send a password-reset email. Always returns the same success copy (no account enumeration). Captcha is required. */
export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values: AuthValues = { email: str(formData.get('email')) }
  const fail = (error: string): AuthState => ({ error, values })
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Enter a valid email')
  const token = captchaToken(formData)
  if (!token) return fail(CAPTCHA_MISSING)
  const supabase = await createClient()
  if (!supabase) return fail(NOT_CONFIGURED)
  const ip = await clientIp()
  const keys = [`reset-ip:${ip}`]
  if (!(await throttleOk(supabase, keys))) return fail(RESET_THROTTLED)
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/reset`,
    captchaToken: token,
  })
  await recordFailure(supabase, keys)
  if (error && isCaptchaError(error)) return fail(CAPTCHA_FAILED)
  if (error) console.error('requestPasswordReset', error.message)
  return { message: RESET_SENT, values }
}

/** Set a new password after the user opens the recovery link (session required). Never echoes the password back. */
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fail = (error: string): AuthState => ({ error })
  const parsed = updatePasswordSchema.safeParse({ password: formData.get('password'), confirm: formData.get('confirm') })
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check your details')
  const supabase = await createClient()
  if (!supabase) return fail(NOT_CONFIGURED)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail(RESET_EXPIRED)
  if (await isPwnedPassword(parsed.data.password)) return fail(PWNED_PASSWORD_MESSAGE)
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    if (/password/i.test(error.message)) return fail('Password is too weak. Use at least 8 characters.')
    console.error('updatePassword', error.message)
    return fail('Could not update your password. Please try again.')
  }
  await supabase.auth.signOut()
  ;(await cookies()).delete(REMEMBER_COOKIE)
  redirect('/sign-in?reset=ok')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase?.auth.signOut()
  ;(await cookies()).delete(REMEMBER_COOKIE)
  redirect('/')
}
