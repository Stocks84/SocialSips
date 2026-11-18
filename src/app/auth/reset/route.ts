import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Recovery-link target. Exchanges ?code= for a session, then sends the user to set a new password. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const supabase = await createClient()
  if (!code || !supabase) return NextResponse.redirect(new URL('/forgot-password?error=link', origin))
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(new URL('/forgot-password?error=link', origin))
  return NextResponse.redirect(new URL('/update-password', origin))
}
