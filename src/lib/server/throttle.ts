import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

// Server-only shared secret: the throttle RPCs refuse calls without it, so nobody can
// call them directly to lock someone else out.
const secret = () => process.env.AUTH_THROTTLE_SECRET

/** False if any key has too many recent failed sign-ins. Fails open (and logs) if misconfigured. */
export async function throttleOk(supabase: SupabaseClient, keys: string[]) {
  const s = secret()
  if (!s) {
    console.error('AUTH_THROTTLE_SECRET is not set; sign-in throttle disabled')
    return true
  }
  const { data, error } = await supabase.rpc('auth_throttle_ok', { p_secret: s, p_keys: keys })
  if (error) console.error('auth_throttle_ok', error.message)
  return data !== false
}

export async function recordFailure(supabase: SupabaseClient, keys: string[]) {
  const s = secret()
  if (!s) return
  const { error } = await supabase.rpc('auth_throttle_fail', { p_secret: s, p_keys: keys })
  if (error) console.error('auth_throttle_fail', error.message)
}
