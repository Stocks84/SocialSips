# Social Sips

Adults-only (18+) PWA for drinking games, cocktails and memes. Repo: https://github.com/Stocks84/SocialSips

## Stack
Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (Auth, Postgres with RLS, Storage), Zod, Playwright, Font Awesome **Free** icons only, hosted on Vercel.

## Commands
- Install: `npm install` (Node 20+; Node 22 recommended)
- Run: copy `.env.example` to `.env.local`, then `npm run dev` → http://localhost:3000
- Unit tests: `node --test --experimental-strip-types src/lib/*.test.ts`
- Typecheck / lint: `npx tsc --noEmit` and `npm run lint`
- E2E (not for a Stop hook): needs a running app; see README (`npm run test:e2e`)
- Build: `npm run build`

## Layout
- `src/app/` routes, `src/components/`, `src/lib/` (queries, server, supabase, validators), `src/types/`
- `supabase/migrations/` (never edit an applied migration; add a new numbered file), `e2e/`, `scripts/`

## Conventions
- Use only the free Font Awesome icon set. Never commit `.env*` (except `.env.example`) or `SUPABASE_SERVICE_ROLE_KEY`.
- Do not put the Turnstile secret in the app; it lives in Supabase Auth only.
- Never commit secrets. `willsto84@gmail.com` is Will's approved public contact on the legal pages only (`src/lib/legal.ts`); never remove it there, and never add it anywhere else. Git author must be `Stocks84 <124254214+Stocks84@users.noreply.github.com>`. Do not push to `main` or merge without Will's approval.

## End-of-job report
Every finished coding job must be reported in this shape. Only list a check under CHECKS RUN if it actually ran; anything untested goes under NOT CHECKED, never left out.

PROJECT: repo and branch
PULL REQUEST: link (or not created)
PREVIEW: link or how to open it (or unavailable)
BUILT: what changed, in plain words
CHECKS RUN: what ran and the result
NOT CHECKED: what nobody tested (e.g. real phone, live data, emails)
KNOWN ISSUES: list, or none
COST / USAGE: where to see it; never guess a number
NEXT DECISION: exactly what Will needs to say yes or no to
