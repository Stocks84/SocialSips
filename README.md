# 🍻 Social Sips

A **PWA** for adults (18+) to share drinking games, cocktails and memes, rated by hangover severity. Dark neon look: deep navy, purple, cyan and pink.

**Stack:** Next.js 15 (App Router, Server Components + Server Actions) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Auth, Postgres with RLS, Storage) · Zod · Playwright · hosted on Vercel (`fra1`).

## Features

- Age gate (18+) and terms acceptance before using the app
- Feed of drinking games + memes (Everyone / Following tabs, search, hangover filter, top rated), paginated
- Games and cocktails with ratings, comments and user variations; "What can I make?" ingredient matcher
- Jokes & memes with emoji reactions; weekly challenge with winners
- Profiles, follows, blocks, notifications, data export and account deletion
- Moderation: reports (incl. a public DSA report form), hidden content with statements of reasons, admin pages
- Legal pages (Impressum, privacy, terms) and a Help & Responsibility page

## Folder structure

```
SocialSips/
├── public/                 # PWA manifest, icons, minimal service worker (sw.js)
├── supabase/
│   ├── migrations/         # Numbered SQL migrations (0001 … 0031): schema, RLS, grants, RPCs
│   └── seed.sql            # Fictional demo content for local dev
├── scripts/                # gen-types.mjs (DB types), cleanup-orphan-media.mjs (storage clean-up)
├── e2e/                    # Playwright specs + notes (see e2e/README.md)
├── src/
│   ├── app/                # Routes: (auth), (legal), (main) app shell, auth/callback
│   ├── components/         # UI building blocks by area (ui, games, cocktails, memes, profile, …)
│   ├── lib/
│   │   ├── queries/        # Server-side Supabase reads
│   │   ├── server/         # Server-only helpers (auth, throttle, uploads, pwned check, errors)
│   │   ├── supabase/       # @supabase/ssr clients (server + middleware)
│   │   └── validators/     # Zod schemas for every form
│   ├── types/              # DB + domain types
│   └── middleware.ts       # Session refresh, age gate, auth-only routes
├── next.config.ts          # Security headers (CSP etc.) and image hosts
└── .env.example            # Env var template (no secrets)
```

## Setup

1. **Install:** `npm install` (Node 20+, Node 22 recommended).
2. **Supabase:** create a project at [supabase.com](https://supabase.com) (free tier is fine).
3. **Env:** `cp .env.example .env.local` and fill in the values (see below).
4. **Database:** apply `supabase/migrations/` in order (see [Migrations](#migrations)), then set the shared secret once in the SQL editor:
   ```sql
   insert into private.app_config (key, value) values ('auth_throttle_secret', '<same value as AUTH_THROTTLE_SECRET>');
   ```
5. **Run:** `npm run dev` → http://localhost:3000

Without Supabase env vars the app still builds and renders, with empty lists and no auth.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | app | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | app | Supabase anon (public) key; all access is limited by RLS |
| `AUTH_THROTTLE_SECRET` | app, server-only | Shared secret for throttle/rate-limit RPCs and for signing the age and terms cookies. Must match `private.app_config.auth_throttle_secret`. Generate with `openssl rand -hex 32`. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | scripts only | For `scripts/cleanup-orphan-media.mjs`. Never put the service role key in the app or in Vercel. |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `npm run test:e2e` | Playwright e2e suite (needs a running app) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run gen:types` | Regenerate `src/types/supabase.ts` from the migrations (uses a throwaway embedded Postgres) |

**Orphaned uploads:** `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/cleanup-orphan-media.mjs --dry-run`, then again without `--dry-run`. It deletes images no post points at that are older than 1 h.

## Migrations

- Migrations live in `supabase/migrations/` as `NNNN_description.sql`, applied in number order. Newer ones are wrapped in `begin; … commit;` and written to be safe to re-run where possible.
- **Never edit an applied migration.** Add a new numbered file instead.
- Workflow: write the file → dry-run it inside `BEGIN … ROLLBACK` against the project → apply (Supabase CLI `supabase db push`, the SQL editor, or the Supabase MCP `apply_migration`) → check the Supabase security and performance advisors.
- After schema changes run `npm run gen:types`.

## Tests

```bash
npx playwright install chromium   # once per machine
npm run dev                       # in another terminal
npm run test:e2e                  # or: BASE_URL=https://<preview>.vercel.app npm run test:e2e
```

Specs live in `e2e/specs/` (age gate, play tab). Tests use throwaway data only: never real user accounts, never real passwords. Date inputs must be filled as `YYYY-MM-DD`. More in [`e2e/README.md`](e2e/README.md).

## Security

- **Row Level Security** on every table. Guests (`anon`) can only read public, non-hidden content; writes need a signed-in user and are checked against `auth.uid()`. Server-owned columns (counters, report status) are forced on insert, and API roles have no `TRUNCATE`/`TRIGGER`/`REFERENCES`/`MAINTAIN` rights.
- **Security headers** (`next.config.ts`): Content-Security-Policy (same origin + this Supabase project only, `frame-ancestors 'none'`, `object-src 'none'`), HSTS, `X-Frame-Options: DENY`, `nosniff`, strict Referrer-Policy, Permissions-Policy, COOP.
- **Leaked-password check** on sign-up via [Have I Been Pwned](https://haveibeenpwned.com/API/v3#PwnedPasswords) k-anonymity: only the first 5 characters of the SHA-1 hash are sent (with padding), 3 s timeout, fails open (`src/lib/server/pwned.ts`). Any future password-reset flow should call `isPwnedPassword` too.
- **Rate limits** in Postgres behind `AUTH_THROTTLE_SECRET`: sign-in throttling, per-user upload limits and a per-IP limit on the public report form.
- **Uploads** are validated and re-encoded on the server (metadata such as GPS is stripped); the browser can't write to Storage directly. Limit: 20 images / 40 MB per user per 24 h.
- **Signed cookies** for the age gate and terms acceptance; redirects go through `safePath()` so they can't point off-site.

## Deployment

Hosted on **Vercel** (region `fra1`, next to the Supabase project in Frankfurt). Set the three app env vars in the Vercel project. Supabase auth needs a server, so static hosts like GitHub Pages won't work.

## 🙏 Drink responsibly

Social Sips is for adults 18+ only. Every game can be played with soft drinks, and nobody should feel pressured to drink. Know your limits, never drink and drive, and look after your friends. UK: Drinkaware / Drinkline 0300 123 1110. Emergency: 112 (EU) / 999 (UK).
