#!/usr/bin/env node
// Deletes stored images that no game, cocktail, meme or profile points at (older than 1 hour).
// Run by hand (no cron):
//   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/cleanup-orphan-media.mjs [--dry-run] [--min-age "1 hour"]
// Uses public.orphan_media() (service role only, migration 0015) and the Storage API to remove the files.
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const ageIdx = args.indexOf('--min-age')
const minAge = ageIdx >= 0 ? args[ageIdx + 1] : '1 hour'

const supabase = createClient(url, key, { auth: { persistSession: false } })
const { data, error } = await supabase.rpc('orphan_media', { p_min_age: minAge })
if (error) {
  console.error('orphan_media failed:', error.message)
  process.exit(1)
}
const byBucket = new Map()
for (const o of data ?? []) byBucket.set(o.bucket_id, [...(byBucket.get(o.bucket_id) ?? []), o.name])
console.log(`${data?.length ?? 0} orphaned file(s)${dryRun ? ' (dry run, nothing deleted)' : ''}`)
for (const [bucket, names] of byBucket) {
  for (const n of names) console.log(`  ${bucket}/${n}`)
  if (dryRun) continue
  for (let i = 0; i < names.length; i += 100) {
    const { error: rmError } = await supabase.storage.from(bucket).remove(names.slice(i, i + 100))
    if (rmError) console.error(`  remove failed in ${bucket}:`, rmError.message)
  }
}
