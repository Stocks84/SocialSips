# 🍻 Social Sips

A modern, fun **PWA** for 18–30 year olds to share drinking games and cocktails, rated by hangover severity. Dark, cool design: deep navy, neon purple, electric cyan and pink.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (auth, Postgres, storage)

> **Status:** project skeleton. Every route renders with the neon theme and placeholder data; Supabase wiring is the next step.

## Folder structure

```
SocialSips/
├── public/                    # Static assets served as-is
│   ├── icons/                 # PWA + favicon icons (placeholders, replace with real art)
│   ├── manifest.json          # PWA manifest (name, colours, icons, shortcuts)
│   └── sw.js                  # Minimal service worker (offline shell, no plugin needed)
├── supabase/
│   ├── migrations/            # SQL schema: tables, hangover_rating enum, RLS, storage buckets
│   └── seed.sql               # Fictional demo games + cocktails for local dev
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # Public landing page
│   │   ├── layout.tsx         # Root layout: fonts, metadata, PWA tags, SW registration
│   │   ├── globals.css        # Design tokens (@theme) + component classes (btn, card, badge…)
│   │   ├── (auth)/            # Centered auth screens: sign-in, sign-up, age-gate
│   │   ├── (main)/            # App shell with nav: feed, games, profile, memes, cocktails, help
│   │   └── auth/callback/     # Supabase email/OAuth redirect handler
│   ├── components/
│   │   ├── ui/                # Generic building blocks (badges, headers, ratings)
│   │   ├── layout/            # Top nav, mobile tab bar, footer, SW register
│   │   ├── games/             # Game cards, filters, hangover picker
│   │   ├── cocktails/         # Cocktail cards
│   │   └── profile/           # Profile header
│   ├── hooks/                 # Client hooks (useSupabase, useUser)
│   ├── lib/
│   │   ├── supabase/          # Browser, server and middleware clients (@supabase/ssr)
│   │   ├── validators/        # Zod schemas for forms (auth, games, comments)
│   │   ├── age.ts             # 18+ helpers
│   │   └── mock-data.ts       # Placeholder content until Supabase is connected
│   ├── types/                 # DB types incl. HangoverRating
│   └── middleware.ts          # Session refresh + age gate + auth protection
├── tailwind.config.ts         # Extra Tailwind config (loaded from globals.css via @config)
└── .env.example               # Env vars template (no secrets)
```

### Routes

| Route | Purpose | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/age-gate` | Date-of-birth check | Public |
| `/sign-in`, `/sign-up` | Auth | Public |
| `/help` | Help & Responsibility | Public |
| `/feed` | Games feed with search + hangover filter | 18+ gate |
| `/games/[id]` | Game page: rules, variations, comments, ratings | 18+ gate |
| `/games/new` | Upload a game | 18+ gate + signed in |
| `/profile/[username]` | Fun user profile | 18+ gate |
| `/memes` | Jokes & Memes | 18+ gate |
| `/cocktails`, `/cocktails/[id]` | Cocktail recipes | 18+ gate |

## Setup

1. **Install:** `npm install` (Node 20+, Node 22 recommended)
2. **Supabase project:** create a free project at [supabase.com](https://supabase.com).
3. **Env:** `cp .env.example .env.local` and fill in the Project URL and anon key (Settings → API).
4. **Database:** with the [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase link --project-ref <ref>` then `supabase db push`. Or paste `supabase/migrations/0001_init.sql` into the SQL editor. For local dev, `supabase start && supabase db reset` also loads `seed.sql`.
5. **Run:** `npm run dev` → http://localhost:3000

The app builds and renders without Supabase configured (it falls back to mock data and skips auth checks).

## Deployment

Supabase auth needs a server (middleware + server components), so **GitHub Pages can't host this**. Use **[Vercel](https://vercel.com)** (free hobby tier): import the repo and add the two env vars.

## V1 roadmap

- [x] Project structure, theme, nav, PWA manifest + service worker
- [x] Database schema with RLS and storage buckets
- [ ] Sign-up with age verification (18+)
- [ ] Fun user profiles (avatar, bio, party vibe, favourite drink)
- [ ] Main feed with search and filters
- [ ] Upload drinking games with hangover rating (No Hangover · Mild Hangover · Two-Day Hangover)
- [ ] Game pages with original rules and user variations
- [ ] Comments and ratings
- [ ] Jokes & Memes page
- [ ] Cocktail recipes section
- [ ] Help & Responsibility page (content in place, links to review)

## 🙏 Drink responsibly

Social Sips is for adults 18+ only. Every game can be played with soft drinks, and nobody should feel pressured to drink. Know your limits, never drink and drive, and look after your friends. UK: Drinkaware / Drinkline 0300 123 1110. Emergency: 112 (EU) / 999 (UK).
