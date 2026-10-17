-- Social Sips — DB-enforced rate limits + cocktail search/sort

-- ─── Rate limits ────────────────────────────────────────────────────────────
-- Generic BEFORE INSERT trigger. Args: owner column, max rows, window, friendly noun.
-- Counts all of the user's rows (including hidden ones) in the window. Admins are exempt.
create or replace function public.enforce_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner_col text := tg_argv[0];
  max_rows int := tg_argv[1]::int;
  win interval := tg_argv[2]::interval;
  noun text := tg_argv[3];
  owner_id uuid;
  recent int;
begin
  execute format('select ($1).%I', owner_col) into owner_id using new;
  if owner_id is null or public.is_admin() then
    return new;
  end if;
  execute format('select count(*) from %I.%I where %I = $1 and created_at > now() - $2',
                 tg_table_schema, tg_table_name, owner_col)
    into recent using owner_id, win;
  if recent >= max_rows then
    raise exception 'Slow down! 🍹 You can post up to % % every %. Try again a bit later.',
      max_rows, noun, tg_argv[4]
      using errcode = 'P0001', hint = 'rate_limit';
  end if;
  return new;
end;
$$;

create trigger rate_limit_games before insert on public.games
  for each row execute function public.enforce_rate_limit('author_id', '5', '1 hour', 'games', 'hour');
create trigger rate_limit_cocktails before insert on public.cocktails
  for each row execute function public.enforce_rate_limit('author_id', '5', '1 hour', 'cocktails', 'hour');
create trigger rate_limit_memes before insert on public.memes
  for each row execute function public.enforce_rate_limit('author_id', '5', '1 hour', 'memes', 'hour');
create trigger rate_limit_comments before insert on public.comments
  for each row execute function public.enforce_rate_limit('author_id', '20', '10 minutes', 'comments', '10 minutes');
create trigger rate_limit_game_variations before insert on public.game_variations
  for each row execute function public.enforce_rate_limit('author_id', '10', '1 hour', 'variations', 'hour');
create trigger rate_limit_cocktail_variations before insert on public.cocktail_variations
  for each row execute function public.enforce_rate_limit('author_id', '10', '1 hour', 'variations', 'hour');
create trigger rate_limit_reports before insert on public.reports
  for each row execute function public.enforce_rate_limit('reporter_id', '10', '1 hour', 'reports', 'hour');

-- ─── Cocktail search: name, description, ingredients; alcohol-free; sort ───
create or replace function public.feed_cocktails(
  q text default null,
  alcohol_free boolean default false,
  sort text default 'newest',
  max_rows int default 60
)
returns table (
  id uuid, name text, description text, is_alcohol_free boolean, image_url text,
  created_at timestamptz, avg_rating numeric, rating_count bigint
)
language sql stable security invoker set search_path = public as $$
  select c.id, c.name, c.description, c.is_alcohol_free, c.image_url, c.created_at,
         round(avg(r.score)::numeric, 2), count(r.id)
  from cocktails c
  left join ratings r on r.cocktail_id = c.id
  where not c.is_hidden
    and (not alcohol_free or c.is_alcohol_free)
    and (q is null or q = '' or (c.name || ' ' || c.description || ' ' || c.ingredients::text) ilike '%' || q || '%')
  group by c.id
  order by
    case when sort = 'top' then coalesce(avg(r.score), 0) end desc nulls last,
    case when sort = 'top' then count(r.id) end desc,
    c.created_at desc
  limit least(max_rows, 100);
$$;
grant execute on function public.feed_cocktails(text, boolean, text, int) to anon, authenticated;

-- ─── Memes: owners can edit their own (was missing from 0001) ───────────────
create policy "own memes update" on public.memes for update using (auth.uid() = author_id);

-- ─── Only admins may change is_hidden (owners' update policies would otherwise allow unhiding) ─
-- SECURITY INVOKER on purpose: current_user must be the caller's role (authenticated/anon).
create or replace function public.guard_is_hidden()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.is_hidden is distinct from old.is_hidden and not public.is_admin()
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'Only admins can hide or unhide content' using errcode = '42501';
  end if;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['games', 'comments', 'game_variations', 'cocktail_variations', 'cocktails', 'memes'] loop
    execute format('create trigger guard_is_hidden before update of is_hidden on public.%I
                    for each row execute function public.guard_is_hidden()', t);
  end loop;
end $$;
