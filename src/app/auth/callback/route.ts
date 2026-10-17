import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safePath } from '@/lib/safe-path'

/** Supabase email-confirmation / OAuth redirect target. Exchanges ?code= for a session. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safePath(searchParams.get('next'))
  const supabase = await createClient()
  if (!code || !supabase) return NextResponse.redirect(new URL('/sign-in?error=link', origin))
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(new URL('/sign-in?error=link', origin))
  return NextResponse.redirect(new URL(next, origin))
}
