#!/usr/bin/env node
// Deletes stored images that no game, cocktail, meme or profile points at (older than 1 hour by default).
// Run by hand (no cron), Node 18+:
//   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/cleanup-orphan-media.mjs [--dry-run] [--min-age "1 hour"]
// Uses public.orphan_media() (service role only, migration 0015) and the Storage API to remove the files.

const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const ageIdx = args.indexOf('--min-age')
const minAge = ageIdx >= 0 ? args[ageIdx + 1] : '1 hour'
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

const res = await fetch(`${url}/rest/v1/rpc/orphan_media`, { method: 'POST', headers, body: JSON.stringify({ p_min_age: minAge }) })
if (!res.ok) {
  console.error('orphan_media failed:', res.status, await res.text())
  process.exit(1)
}
const rows = await res.json()
const byBucket = new Map()
for (const o of rows) byBucket.set(o.bucket_id, [...(byBucket.get(o.bucket_id) ?? []), o.name])
console.log(`${rows.length} orphaned file(s)${dryRun ? ' (dry run, nothing deleted)' : ''}`)
let failed = false
for (const [bucket, names] of byBucket) {
  for (const n of names) console.log(`  ${bucket}/${n}`)
  if (dryRun) continue
  for (let i = 0; i < names.length; i += 100) {
    const rm = await fetch(`${url}/storage/v1/object/${bucket}`, {
      method: 'DELETE', headers, body: JSON.stringify({ prefixes: names.slice(i, i + 100) }),
    })
    if (!rm.ok) {
      failed = true
      console.error(`  remove failed in ${bucket}:`, rm.status, await rm.text())
    }
  }
}
process.exit(failed ? 1 : 0)
