-- Social Sips — initial schema
-- Run with: supabase db push   (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";

-- ─── Enums ──────────────────────────────────────────────────────────────────
create type public.hangover_rating as enum ('no_hangover', 'mild_hangover', 'two_day_hangover');

-- ─── Profiles (1:1 with auth.users) ─────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  bio text check (char_length(bio) <= 280),
  avatar_url text,
  date_of_birth date not null check (date_of_birth <= (current_date - interval '18 years')),
  favourite_drink text,
  party_vibe text,
  created_at timestamptz not null default now()
);

-- Create a profile automatically on sign-up from user metadata (username, date_of_birth).
-- The 18+ CHECK above makes sign-up fail for under-18s.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, date_of_birth)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    (new.raw_user_meta_data ->> 'date_of_birth')::date
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Games ──────────────────────────────────────────────────────────────────
create table public.games (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  slug text unique not null,
  summary text not null,
  rules text not null,
  equipment text[] not null default '{}',
  min_players int not null default 2 check (min_players >= 1),
  max_players int check (max_players is null or max_players >= min_players),
  hangover_rating public.hangover_rating not null,
  tags text[] not null default '{}',
  cover_image_url text,
  search tsvector generated always as (to_tsvector('english', title || ' ' || summary)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index games_search_idx on public.games using gin (search);
create index games_hangover_idx on public.games (hangover_rating);

create table public.game_variations (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  rules text not null,
  created_at timestamptz not null default now()
);

-- ─── Cocktails & memes ──────────────────────────────────────────────────────
create table public.cocktails (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  name text not null,
  description text not null,
  ingredients jsonb not null default '[]',
  method text not null,
  is_alcohol_free boolean not null default false,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.memes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  caption text,
  image_url text,
  joke_text text,
  created_at timestamptz not null default now(),
  check (image_url is not null or joke_text is not null)
);

-- ─── Comments & ratings (on a game OR a cocktail) ───────────────────────────
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid references public.games (id) on delete cascade,
  cocktail_id uuid references public.cocktails (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  check (num_nonnulls(game_id, cocktail_id) = 1)
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid references public.games (id) on delete cascade,
  cocktail_id uuid references public.cocktails (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  check (num_nonnulls(game_id, cocktail_id) = 1),
  unique (user_id, game_id),
  unique (user_id, cocktail_id)
);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Everything is publicly readable; users can only write their own rows.
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_variations enable row level security;
alter table public.cocktails enable row level security;
alter table public.memes enable row level security;
alter table public.comments enable row level security;
alter table public.ratings enable row level security;

create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create policy "games readable" on public.games for select using (true);
create policy "own games insert" on public.games for insert with check (auth.uid() = author_id);
create policy "own games update" on public.games for update using (auth.uid() = author_id);
create policy "own games delete" on public.games for delete using (auth.uid() = author_id);

create policy "variations readable" on public.game_variations for select using (true);
create policy "own variations insert" on public.game_variations for insert with check (auth.uid() = author_id);
create policy "own variations modify" on public.game_variations for update using (auth.uid() = author_id);
create policy "own variations delete" on public.game_variations for delete using (auth.uid() = author_id);

create policy "cocktails readable" on public.cocktails for select using (true);
create policy "own cocktails insert" on public.cocktails for insert with check (auth.uid() = author_id);
create policy "own cocktails update" on public.cocktails for update using (auth.uid() = author_id);
create policy "own cocktails delete" on public.cocktails for delete using (auth.uid() = author_id);

create policy "memes readable" on public.memes for select using (true);
create policy "own memes insert" on public.memes for insert with check (auth.uid() = author_id);
create policy "own memes delete" on public.memes for delete using (auth.uid() = author_id);

create policy "comments readable" on public.comments for select using (true);
create policy "own comments insert" on public.comments for insert with check (auth.uid() = author_id);
create policy "own comments delete" on public.comments for delete using (auth.uid() = author_id);

create policy "ratings readable" on public.ratings for select using (true);
create policy "own ratings insert" on public.ratings for insert with check (auth.uid() = user_id);
create policy "own ratings update" on public.ratings for update using (auth.uid() = user_id);
create policy "own ratings delete" on public.ratings for delete using (auth.uid() = user_id);

-- ─── Storage ────────────────────────────────────────────────────────────────
-- Public buckets: avatars, game-covers, memes, cocktails.
-- Convention: files are stored under "<user_id>/<filename>" so policies can check ownership.
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('game-covers', 'game-covers', true),
  ('memes', 'memes', true),
  ('cocktails', 'cocktails', true)
on conflict (id) do nothing;

create policy "public read media" on storage.objects for select
  using (bucket_id in ('avatars', 'game-covers', 'memes', 'cocktails'));
create policy "users upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'game-covers', 'memes', 'cocktails')
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own files" on storage.objects for delete to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
