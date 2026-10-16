-- Social Sips — reports (moderation) + feed search/sort with rating stats

-- ─── Reports ────────────────────────────────────────────────────────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('game', 'comment', 'variation', 'cocktail')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'dangerous', 'underage', 'hate', 'other')),
  note text check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index reports_status_idx on public.reports (status, created_at);

alter table public.reports enable row level security;
-- Signed-in users may file their own reports. No select/update/delete policies:
-- nobody can read reports through the API; review them in the Supabase dashboard.
create policy "own reports insert" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

-- ─── Feed: search across title, summary, rules and tags; sort newest / top ──
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
  where (hangover is null or g.hangover_rating = hangover)
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

grant execute on function public.feed_games(text, public.hangover_rating, text, int) to anon, authenticated;
