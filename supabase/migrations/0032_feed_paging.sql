-- 0032: lift the feed 100-row cap with keyset paging inside the RPCs.
-- Newest/following lists page by (created_at, id). "Top" sort pages by row_offset.
-- least(max_rows, 100) is now a per-request cap, not a total result cap.
-- Visibility stays the same: hidden rows are excluded, SECURITY INVOKER so RLS still applies.
-- First pages still work against the pre-0032 functions (they only send max_rows).
-- Apply this to the live project before "Load more" / later pages are used: those calls
-- send before_at / before_id (newest) or row_offset (top), which the current functions do not have.
begin;

drop function if exists public.feed_games(text, public.hangover_rating, text, int);
drop function if exists public.feed_cocktails(text, boolean, text, integer, text);
drop function if exists public.following_feed_games(int);
drop function if exists public.following_meme_ids(int);

create function public.feed_games(
  q text default null,
  hangover public.hangover_rating default null,
  sort text default 'newest',
  max_rows int default 50,
  before_at timestamptz default null,
  before_id uuid default null,
  row_offset int default 0
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
    and (
      sort = 'top' or before_at is null
      or g.created_at < before_at
      or (before_id is not null and g.created_at = before_at and g.id < before_id)
    )
  group by g.id
  order by
    case when sort = 'top' then coalesce(avg(r.score), 0) end desc nulls last,
    case when sort = 'top' then count(r.id) end desc,
    g.created_at desc,
    g.id desc
  limit least(greatest(coalesce(max_rows, 1), 1), 100)
  offset case when sort = 'top' then greatest(coalesce(row_offset, 0), 0) else 0 end;
$$;

create function public.feed_cocktails(
  q text default null, alcohol_free boolean default false, sort text default 'newest',
  max_rows integer default 60, ing text default null,
  before_at timestamptz default null, before_id uuid default null, row_offset int default 0
)
returns table(id uuid, name text, description text, is_alcohol_free boolean, image_url text,
              created_at timestamptz, avg_rating numeric, rating_count bigint)
language sql stable security invoker set search_path = public as $$
  with
  -- Small synonym list: searching the key also matches each synonym (whole words, any case).
  -- Add a row here to extend it. Rum styles (white/dark/aged/spiced rum) already match "rum" as a word.
  synonyms(term, syn) as (values
    ('whiskey', 'whisky'), ('whiskey', 'bourbon'), ('whiskey', 'rye'), ('whiskey', 'scotch'),
    ('whisky', 'whiskey'), ('whisky', 'bourbon'), ('whisky', 'rye'), ('whisky', 'scotch'),
    ('rum', 'rhum'), ('rum', 'cachaça')
  ),
  raw as (
    select lower(btrim(ing)) as w where ing is not null and btrim(ing) <> ''
    union select s.syn from synonyms s where s.term = lower(btrim(ing))
  ),
  -- escape regex metacharacters so typed text is matched literally
  terms as (select regexp_replace(w, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g') as rx from raw)
  select c.id, c.name, c.description, c.is_alcohol_free, c.image_url, c.created_at,
         round(avg(r.score)::numeric, 2), count(r.id)
  from cocktails c
  left join ratings r on r.cocktail_id = c.id
  where not c.is_hidden
    and (not alcohol_free or c.is_alcohol_free)
    and (q is null or q = ''
         or (c.name || ' ' || c.description) ilike '%' || q || '%'
         or exists (select 1 from jsonb_array_elements(c.ingredients) e
                    where coalesce(e->>'item', '') || ' ' || coalesce(e->>'amount', '') ilike '%' || q || '%'))
    and (ing is null or btrim(ing) = ''
         or exists (select 1 from jsonb_array_elements(c.ingredients) e, terms t
                    where coalesce(e->>'item', '') ~* ('\m' || t.rx || '\M')))
    and (
      sort = 'top' or before_at is null
      or c.created_at < before_at
      or (before_id is not null and c.created_at = before_at and c.id < before_id)
    )
  group by c.id
  order by
    case when sort = 'top' then coalesce(avg(r.score), 0) end desc nulls last,
    case when sort = 'top' then count(r.id) end desc,
    c.created_at desc,
    c.id desc
  limit least(greatest(coalesce(max_rows, 1), 1), 100)
  offset case when sort = 'top' then greatest(coalesce(row_offset, 0), 0) else 0 end;
$$;

create function public.following_feed_games(
  max_rows int default 50,
  before_at timestamptz default null,
  before_id uuid default null
)
returns table (id uuid, title text, summary text, hangover_rating hangover_rating, min_players integer, tags text[], created_at timestamptz, avg_rating numeric, rating_count bigint)
language sql stable security invoker set search_path = public as $$
  select g.id, g.title, g.summary, g.hangover_rating, g.min_players, g.tags, g.created_at,
         round(avg(r.score)::numeric, 2), count(r.id)
  from public.follows f
  join public.games g on g.author_id = f.followee_id
  left join public.ratings r on r.game_id = g.id
  where f.follower_id = (select auth.uid()) and not g.is_hidden
    and (
      before_at is null
      or g.created_at < before_at
      or (before_id is not null and g.created_at = before_at and g.id < before_id)
    )
  group by g.id
  order by g.created_at desc, g.id desc
  limit least(greatest(coalesce(max_rows, 1), 1), 100);
$$;

create function public.following_meme_ids(
  max_rows int default 20,
  before_at timestamptz default null,
  before_id uuid default null
)
returns setof uuid language sql stable security invoker set search_path = public as $$
  select m.id from public.follows f join public.memes m on m.author_id = f.followee_id
  where f.follower_id = (select auth.uid()) and not m.is_hidden
    and (
      before_at is null
      or m.created_at < before_at
      or (before_id is not null and m.created_at = before_at and m.id < before_id)
    )
  order by m.created_at desc, m.id desc
  limit least(greatest(coalesce(max_rows, 1), 1), 100);
$$;

-- Keyset order is (created_at desc, id desc). Existing created_at / author_id indexes
-- from 0006 do not include id or the visible-only predicate.
create index if not exists games_feed_created_id_idx
  on public.games (created_at desc, id desc) where not is_hidden;
create index if not exists cocktails_feed_created_id_idx
  on public.cocktails (created_at desc, id desc) where not is_hidden;
create index if not exists memes_feed_created_id_idx
  on public.memes (created_at desc, id desc) where not is_hidden;
create index if not exists games_author_created_id_idx
  on public.games (author_id, created_at desc, id desc) where not is_hidden;
create index if not exists memes_author_created_id_idx
  on public.memes (author_id, created_at desc, id desc) where not is_hidden;

revoke all on function public.feed_games(text, public.hangover_rating, text, int, timestamptz, uuid, int) from public;
revoke all on function public.feed_cocktails(text, boolean, text, integer, text, timestamptz, uuid, int) from public;
revoke all on function public.following_feed_games(int, timestamptz, uuid) from public;
revoke all on function public.following_meme_ids(int, timestamptz, uuid) from public;

grant execute on function public.feed_games(text, public.hangover_rating, text, int, timestamptz, uuid, int) to anon, authenticated, service_role;
grant execute on function public.feed_cocktails(text, boolean, text, integer, text, timestamptz, uuid, int) to anon, authenticated, service_role;
grant execute on function public.following_feed_games(int, timestamptz, uuid) to authenticated, service_role;
grant execute on function public.following_meme_ids(int, timestamptz, uuid) to authenticated, service_role;

commit;
