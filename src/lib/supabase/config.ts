/** Returns Supabase env config, or null when not configured (lets the app render without a live project). */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey || url.includes('your-project')) return null
  return { url, anonKey }
}
