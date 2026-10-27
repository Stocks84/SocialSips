import EmbeddedPostgres from 'embedded-postgres'
import { execFileSync } from 'child_process'
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const MIG_DIR = '/workspace/SocialSips/supabase/migrations'
const OUT = '/workspace/SocialSips/src/types/supabase.ts'
const DATA = '/tmp/pg-typegen/data'
const PORT = 55432

/** Split SQL into statements, respecting $$ / $tag$ dollar quotes and quotes. */
function splitSql(sql) {
  const out = []
  let cur = ''
  let i = 0
  let inSingle = false
  let dollarTag = null
  while (i < sql.length) {
    const c = sql[i]
    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        cur += dollarTag
        i += dollarTag.length
        dollarTag = null
        continue
      }
      cur += c; i++; continue
    }
    if (inSingle) {
      cur += c
      if (c === "'" && sql[i + 1] === "'") { cur += "'"; i += 2; continue }
      if (c === "'") inSingle = false
      i++; continue
    }
    if (c === "'") { inSingle = true; cur += c; i++; continue }
    if (c === '$') {
      const m = sql.slice(i).match(/^\$([a-zA-Z_]*)\$/)
      if (m) { dollarTag = m[0]; cur += m[0]; i += m[0].length; continue }
    }
    if (c === '-' && sql[i + 1] === '-') {
      // line comment
      while (i < sql.length && sql[i] !== '\n') { cur += sql[i]; i++ }
      continue
    }
    if (c === '/' && sql[i + 1] === '*') {
      cur += c; i++
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) { cur += sql[i]; i++ }
      cur += '*/'; i += 2; continue
    }
    if (c === ';') {
      const s = cur.trim()
      if (s) out.push(s)
      cur = ''; i++; continue
    }
    cur += c; i++
  }
  const s = cur.trim()
  if (s) out.push(s)
  return out
}

mkdirSync(DATA, { recursive: true })
const pg = new EmbeddedPostgres({
  databaseDir: DATA, user: 'postgres', password: 'postgres', port: PORT,
  persistent: true, authMethod: 'trust', onLog: () => {}, onError: () => {},
})
await pg.initialise()
await pg.start()
const client = pg.getPgClient('postgres', '127.0.0.1')
await client.connect()

const bootstrap = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticator NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT anon, authenticated, service_role TO postgres;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  instance_id uuid,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_sso_user boolean DEFAULT false,
  is_anonymous boolean DEFAULT false,
  deleted_at timestamptz
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon')
$$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY, name text NOT NULL, public boolean DEFAULT false, owner uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  file_size_limit bigint, allowed_mime_types text[]
);
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text, owner uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz, metadata jsonb, path_tokens text[], version text, owner_id text
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT string_to_array(name, '/')
$$;
CREATE OR REPLACE FUNCTION storage.filename(name text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT (string_to_array(name, '/'))[array_length(string_to_array(name, '/'), 1)]
$$;
CREATE OR REPLACE FUNCTION storage.extension(name text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT reverse(split_part(reverse(storage.filename(name)), '.', 1))
$$;
`
for (const stmt of splitSql(bootstrap)) {
  await client.query(stmt)
}
console.log('bootstrap ok')

const files = readdirSync(MIG_DIR).filter(f => f.endsWith('.sql')).sort()
let okFiles = 0, failStmts = 0
for (const f of files) {
  const sql = readFileSync(join(MIG_DIR, f), 'utf8')
  const stmts = splitSql(sql)
  let fileOk = true
  for (const stmt of stmts) {
    try {
      await client.query(stmt)
    } catch (e) {
      fileOk = false
      failStmts++
      try { await client.query('ROLLBACK') } catch {}
      const msg = e.message.split('\n')[0].slice(0, 120)
      if (failStmts <= 40) console.log(`  skip ${f}: ${msg}`)
    }
  }
  console.log(`${fileOk ? 'OK' : 'PARTIAL'} ${f} (${stmts.length} stmts)`)
  if (fileOk) okFiles++
}
const tables = await client.query(`select tablename from pg_tables where schemaname='public' order by 1`)
console.log('tables (' + tables.rows.length + '):', tables.rows.map(r => r.tablename).join(', '))
const enums = await client.query(`select t.typname from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typtype='e' order by 1`)
console.log('enums:', enums.rows.map(r => r.typname).join(', '))
const funcs = await client.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and p.proname not like 'pgp_%' and p.proname not like 'armor%' and p.proname not like 'crypt%' and p.proname not like 'digest%' and p.proname not like 'hmac%' and p.proname not like 'encrypt%' and p.proname not like 'decrypt%' and p.proname not like 'gen_%' and p.proname <> 'fips_mode' and p.proname <> 'dearmor' order by 1`)
console.log('app funcs (' + funcs.rows.length + '):', funcs.rows.map(r => r.proname).join(', '))
await client.end()

const dbUrl = `postgresql://postgres@127.0.0.1:${PORT}/postgres?sslmode=disable`
console.log('gen types...')
const out = execFileSync('npx', ['supabase', 'gen', 'types', 'typescript', '--db-url', dbUrl, '--schema', 'public'], {
  cwd: '/workspace/SocialSips', encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
})
const header = `/**
 * Generated from supabase/migrations via local embedded Postgres + \`supabase gen types\`.
 * Do not edit by hand. Domain constants (HANGOVER_*) live in src/types/domain.ts.
 */
`
let typed = header + out
// supabase gen types omits nullability for DEFAULT NULL / nullable params — restore where SQL allows null.
const nullablePatches = [
  [
`      feed_cocktails: {
        Args: {
          alcohol_free?: boolean;
          ing?: string;
          max_rows?: number;
          q?: string;
          sort?: string;
        };`,
`      feed_cocktails: {
        Args: {
          alcohol_free?: boolean;
          ing?: string | null;
          max_rows?: number;
          q?: string | null;
          sort?: string;
        };`,
  ],
  [
`      feed_games: {
        Args: {
          hangover?: Database["public"]["Enums"]["hangover_rating"];
          max_rows?: number;
          q?: string;
          sort?: string;
        };`,
`      feed_games: {
        Args: {
          hangover?: Database["public"]["Enums"]["hangover_rating"] | null;
          max_rows?: number;
          q?: string | null;
          sort?: string;
        };`,
  ],
  [
`      mark_notifications_read: {
        Args: { p_ids?: string[] };
        Returns: undefined;
      };`,
`      mark_notifications_read: {
        Args: { p_ids?: string[] | null };
        Returns: undefined;
      };`,
  ],
  [
`      set_challenge_vote: {
        Args: { p_challenge: string; p_entry: string };
        Returns: Json;
      };`,
`      set_challenge_vote: {
        Args: { p_challenge: string; p_entry: string | null };
        Returns: Json;
      };`,
  ],
  [
`      set_reaction: {
        Args: { p_emoji: string; p_meme: string };
        Returns: Json;
      };`,
`      set_reaction: {
        Args: { p_emoji: string | null; p_meme: string };
        Returns: Json;
      };`,
  ],
  [
`      submit_public_report: {
        Args: {
          p_email: string;
          p_note: string;
          p_reason: string;
          p_secret: string;
          p_target_id: string;
          p_target_type: string;
          p_target_url: string;
        };
        Returns: string;
      };`,
`      submit_public_report: {
        Args: {
          p_email: string | null;
          p_note: string;
          p_reason: string;
          p_secret: string;
          p_target_id: string | null;
          p_target_type: string;
          p_target_url: string | null;
        };
        Returns: string;
      };`,
  ],
  [
`      top_memes: {
        Args: { p_limit?: number; p_offset?: number; p_since?: string };
        Returns: {`,
`      top_memes: {
        Args: { p_limit?: number; p_offset?: number; p_since?: string | null };
        Returns: {`,
  ],
]
for (const [from, to] of nullablePatches) {
  if (!typed.includes(from)) console.warn('nullable patch miss:', from.slice(0, 60))
  else typed = typed.replace(from, to)
}
writeFileSync(OUT, typed)
console.log('wrote', OUT, 'lines', typed.split('\n').length, 'okFiles', okFiles, 'failStmts', failStmts)
await pg.stop()
process.exit(0)
