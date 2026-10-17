'use server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { signInSchema, signUpSchema } from '@/lib/validators/auth'

export type AuthState = { error?: string; message?: string }

const NOT_CONFIGURED = 'Supabase is not configured. Add .env.local (see README).'

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    username: String(formData.get('username') ?? '').trim().toLowerCase(),
    dateOfBirth: formData.get('dateOfBirth'),
    ageConfirmed: formData.get('ageConfirmed') === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check your details' }

  const supabase = await createClient()
  if (!supabase) return { error: NOT_CONFIGURED }

  const { email, password, username, dateOfBirth } = parsed.data
  const origin = (await headers()).get('origin') ?? ''
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { username, date_of_birth: dateOfBirth, age_confirmed: true },
    },
  })
  if (error) {
    const msg = error.message
    if (msg.includes('date_of_birth')) return { error: 'You must be 18 or over to join Social Sips.' }
    if (msg.includes('Age confirmation')) return { error: 'Please confirm you are 18 or over.' }
    if (msg.includes('username') || msg.includes('duplicate')) return { error: 'That username is taken.' }
    if (msg.includes('Database error')) return { error: 'Could not create your account. Try another username.' }
    return { error: msg }
  }
  if (!data.session) return { message: 'Check your email to confirm your account 📬' }
  redirect('/feed')
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { error: 'Enter your email and password' }
  const supabase = await createClient()
  if (!supabase) return { error: NOT_CONFIGURED }
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: error.message }
  const next = String(formData.get('redirectTo') || '/feed')
  redirect(next.startsWith('/') ? next : '/feed')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase?.auth.signOut()
  redirect('/')
}
