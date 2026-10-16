-- Social Sips — admin moderation, hidden content, cocktail variations

-- ─── Admin flag (users can't grant it to themselves) ────────────────────────
alter table public.profiles add column is_admin boolean not null default false;

-- Column-level privileges: users may only update their own profile's public fields.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, bio, avatar_url, favourite_drink, party_vibe) on public.profiles to authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ─── Cocktail variations ────────────────────────────────────────────────────
create table public.cocktail_variations (
  id uuid primary key default gen_random_uuid(),
  cocktail_id uuid not null references public.cocktails (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  rules text not null,
  created_at timestamptz not null default now()
);
alter table public.cocktail_variations enable row level security;
create policy "own cocktail variations insert" on public.cocktail_variations for insert with check (auth.uid() = author_id);
create policy "own cocktail variations update" on public.cocktail_variations for update using (auth.uid() = author_id);
create policy "own cocktail variations delete" on public.cocktail_variations for delete using (auth.uid() = author_id);

-- ─── Hidden flag + visibility policies + admin powers ───────────────────────
do $$
declare t text;
begin
  foreach t in array array['games', 'comments', 'game_variations', 'cocktail_variations', 'cocktails', 'memes'] loop
    execute format('alter table public.%I add column if not exists is_hidden boolean not null default false', t);
    execute format('create policy "admin update %1$s" on public.%1$I for update using (public.is_admin())', t);
    execute format('create policy "admin delete %1$s" on public.%1$I for delete using (public.is_admin())', t);
  end loop;
end $$;

-- Replace "readable by everyone" with "visible unless hidden (admins see all)"
drop policy "games readable" on public.games;
drop policy "comments readable" on public.comments;
drop policy "variations readable" on public.game_variations;
drop policy "cocktails readable" on public.cocktails;
drop policy "memes readable" on public.memes;
create policy "games visible" on public.games for select using (not is_hidden or public.is_admin());
create policy "comments visible" on public.comments for select using (not is_hidden or public.is_admin());
create policy "variations visible" on public.game_variations for select using (not is_hidden or public.is_admin());
create policy "cocktail variations visible" on public.cocktail_variations for select using (not is_hidden or public.is_admin());
create policy "cocktails visible" on public.cocktails for select using (not is_hidden or public.is_admin());
create policy "memes visible" on public.memes for select using (not is_hidden or public.is_admin());

-- ─── Reports: more target types, admin read/update/delete ───────────────────
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports add constraint reports_target_type_check
  check (target_type in ('game', 'comment', 'variation', 'cocktail', 'cocktail_variation', 'meme'));
create policy "admin read reports" on public.reports for select using (public.is_admin());
create policy "admin update reports" on public.reports for update using (public.is_admin());
create policy "admin delete reports" on public.reports for delete using (public.is_admin());

-- ─── Storage: admins can remove any media ───────────────────────────────────
create policy "admins delete any media" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'game-covers', 'memes', 'cocktails') and public.is_admin());

-- ─── Feed never shows hidden games (even to admins) ─────────────────────────
create or replace function public.feed_games(
  q text default null,
  hangover public.hangover_rating default null,
  sort text default 'newest',
  max_rows int default 50
)
returns table (
  id uuid, title text, summary text, hangover_rating public.hangover_rating,
  min_players int, tags text[], created_at timestamptz,
  avg_rating numeric, rating_count bigint
)
language sql stable security invoker set search_path = public as $$
  select g.id, g.title, g.summary, g.hangover_rating, g.min_players, g.tags, g.created_at,
         round(avg(r.score)::numeric, 2) as avg_rating,
         count(r.id) as rating_count
  from games g
  left join ratings r on r.game_id = g.id
  where not g.is_hidden
    and (hangover is null or g.hangover_rating = hangover)
    and (
      q is null or q = '' or
      (g.title || ' ' || g.summary || ' ' || g.rules || ' ' || array_to_string(g.tags, ' '))
        ilike '%' || q || '%'
    )
  group by g.id
  order by
    case when sort = 'top' then coalesce(avg(r.score), 0) end desc nulls last,
    case when sort = 'top' then count(r.id) end desc,
    g.created_at desc
  limit least(max_rows, 100);
$$;
