import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Supabase email-confirmation / OAuth redirect target. Exchanges ?code= for a session. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/feed'
  const supabase = await createClient()
  if (code && supabase) {
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}${next}`)
}
