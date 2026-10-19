-- Weekly Challenge: one challenge per week (Mon 00:00 – Sun 23:59 Europe/Vienna).
-- Admins schedule future weeks; if none is scheduled, current_challenge() creates a default.
-- Entries and votes are written only through SECURITY DEFINER functions with all rules checked server-side.

create or replace function public.challenge_week_start(p_at timestamptz default now())
returns date language sql stable set search_path = public as $$
  select date_trunc('week', p_at at time zone 'Europe/Vienna')::date;
$$;

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null unique check (extract(isodow from starts_on) = 1),
  theme text not null check (char_length(btrim(theme)) between 3 and 80),
  kind text not null check (kind in ('meme', 'cocktail_variation')),
  description text check (description is null or char_length(description) <= 500),
  is_default boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
comment on table public.challenges is 'Weekly challenges. Week = starts_on (Monday) 00:00 to next Monday 00:00 Europe/Vienna.';

create or replace function public.challenge_ends_at(p_starts_on date)
returns timestamptz language sql immutable set search_path = public as $$
  select ((p_starts_on + 7)::timestamp at time zone 'Europe/Vienna');
$$;

alter table public.challenges enable row level security;
create policy "challenges public read" on public.challenges for select using (true);
create policy "admin schedules future" on public.challenges for insert to authenticated
  with check (public.is_admin() and starts_on > public.challenge_week_start());
create policy "admin edits future" on public.challenges for update to authenticated
  using (public.is_admin() and starts_on > public.challenge_week_start())
  with check (public.is_admin() and starts_on > public.challenge_week_start());
create policy "admin deletes future" on public.challenges for delete to authenticated
  using (public.is_admin() and starts_on > public.challenge_week_start());
revoke all on public.challenges from anon, authenticated;
grant select on public.challenges to anon, authenticated;
grant insert (starts_on, theme, kind, description) on public.challenges to authenticated;
grant update (theme, kind, description) on public.challenges to authenticated;
grant delete on public.challenges to authenticated;

create table public.challenge_entries (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  meme_id uuid references public.memes(id) on delete cascade,
  cocktail_variation_id uuid references public.cocktail_variations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id),
  check (num_nonnulls(meme_id, cocktail_variation_id) = 1)
);
create index on public.challenge_entries (challenge_id);
create index on public.challenge_entries (user_id);
alter table public.challenge_entries enable row level security;
create policy "own entries read" on public.challenge_entries for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
revoke all on public.challenge_entries from anon, authenticated;
grant select on public.challenge_entries to authenticated;

create table public.challenge_votes (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  entry_id uuid not null references public.challenge_entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (challenge_id, voter_id)
);
create index on public.challenge_votes (entry_id);
alter table public.challenge_votes enable row level security;
create policy "own votes read" on public.challenge_votes for select to authenticated
  using (voter_id = (select auth.uid()));
revoke all on public.challenge_votes from anon, authenticated;
grant select on public.challenge_votes to authenticated;

create table private.challenge_rate (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  n int not null default 0
);

-- 20 entry/vote actions per minute per user (same shape as the reaction limit).
create or replace function private.challenge_rate_ok(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare cur int;
begin
  insert into private.challenge_rate as r (user_id, window_start, n) values (p_uid, now(), 1)
  on conflict (user_id) do update
    set n = case when r.window_start < now() - interval '1 minute' then 1 else r.n + 1 end,
        window_start = case when r.window_start < now() - interval '1 minute' then now() else r.window_start end
  returning n into cur;
  if cur > 20 then
    raise exception 'Slow down! 🍹 Too many challenge actions. Try again in a minute.' using errcode = 'P0001', hint = 'rate_limit';
  end if;
end;
$$;
revoke all on function private.challenge_rate_ok(uuid) from public, anon, authenticated;

-- Current week's challenge; creates the default (alternating meme / cocktail) if none is scheduled.
create or replace function public.current_challenge()
returns setof public.challenges language plpgsql security definer set search_path = public as $$
declare v_week date := public.challenge_week_start();
begin
  if not exists (select 1 from public.challenges where starts_on = v_week) then
    insert into public.challenges (starts_on, theme, kind, description, is_default, created_by)
    select v_week,
      case when extract(week from v_week)::int % 2 = 1 then 'Meme of the week' else 'Cocktail of the week' end,
      case when extract(week from v_week)::int % 2 = 1 then 'meme' else 'cocktail_variation' end,
      case when extract(week from v_week)::int % 2 = 1
        then 'Post your funniest party meme and enter it. The meme with the most votes by Sunday night wins.'
        else 'Add your best twist on any cocktail as a variation and enter it. The most-voted twist by Sunday night wins.' end,
      true, null
    on conflict (starts_on) do nothing;
  end if;
  return query select * from public.challenges where starts_on = v_week;
end;
$$;
grant execute on function public.current_challenge() to anon, authenticated;

create or replace function private.challenge_open(c public.challenges)
returns boolean language sql stable as $$
  select now() >= (c.starts_on::timestamp at time zone 'Europe/Vienna') and now() < public.challenge_ends_at(c.starts_on);
$$;

-- Is the entry's submission visible (not hidden) right now?
create or replace function private.entry_visible(e public.challenge_entries)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select not m.is_hidden from public.memes m where m.id = e.meme_id),
                  (select not v.is_hidden from public.cocktail_variations v where v.id = e.cocktail_variation_id), false);
$$;

create or replace function public.enter_challenge(p_challenge uuid, p_submission uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); c public.challenges; v_id uuid;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into c from public.challenges where id = p_challenge;
  if not found then raise exception 'challenge_not_found' using errcode = 'P0002'; end if;
  if not private.challenge_open(c) then raise exception 'challenge_closed' using errcode = 'P0001'; end if;
  perform private.challenge_rate_ok(v_uid);
  if c.kind = 'meme' then
    if not exists (select 1 from public.memes where id = p_submission and author_id = v_uid and not is_hidden) then
      raise exception 'not_your_submission' using errcode = '42501'; end if;
    insert into public.challenge_entries (challenge_id, user_id, meme_id) values (c.id, v_uid, p_submission)
    on conflict (challenge_id, user_id) do nothing returning id into v_id;
  else
    if not exists (select 1 from public.cocktail_variations where id = p_submission and author_id = v_uid and not is_hidden) then
      raise exception 'not_your_submission' using errcode = '42501'; end if;
    insert into public.challenge_entries (challenge_id, user_id, cocktail_variation_id) values (c.id, v_uid, p_submission)
    on conflict (challenge_id, user_id) do nothing returning id into v_id;
  end if;
  if v_id is null then raise exception 'already_entered' using errcode = '23505'; end if;
  return v_id;
end;
$$;
grant execute on function public.enter_challenge(uuid, uuid) to authenticated;

create or replace function public.withdraw_challenge_entry(p_challenge uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); c public.challenges;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into c from public.challenges where id = p_challenge;
  if not found or not private.challenge_open(c) then raise exception 'challenge_closed' using errcode = 'P0001'; end if;
  perform private.challenge_rate_ok(v_uid);
  delete from public.challenge_entries where challenge_id = c.id and user_id = v_uid;
end;
$$;
grant execute on function public.withdraw_challenge_entry(uuid) to authenticated;

-- One vote per user per challenge; p_entry null removes the vote. Returns the entry's new count + my vote.
create or replace function public.set_challenge_vote(p_challenge uuid, p_entry uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); c public.challenges; e public.challenge_entries;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into c from public.challenges where id = p_challenge;
  if not found then raise exception 'challenge_not_found' using errcode = 'P0002'; end if;
  if not private.challenge_open(c) then raise exception 'challenge_closed' using errcode = 'P0001'; end if;
  perform private.challenge_rate_ok(v_uid);
  if p_entry is null then
    delete from public.challenge_votes where challenge_id = c.id and voter_id = v_uid;
  else
    select * into e from public.challenge_entries where id = p_entry and challenge_id = c.id;
    if not found or not private.entry_visible(e) then raise exception 'entry_not_found' using errcode = 'P0002'; end if;
    if e.user_id = v_uid then raise exception 'own_entry' using errcode = '42501'; end if;
    if public.i_block(e.user_id) or public.blocked_by(e.user_id) then raise exception 'blocked' using errcode = '42501'; end if;
    insert into public.challenge_votes (challenge_id, voter_id, entry_id) values (c.id, v_uid, e.id)
    on conflict (challenge_id, voter_id) do update set entry_id = excluded.entry_id, created_at = now()
      where public.challenge_votes.entry_id is distinct from excluded.entry_id;
  end if;
  return jsonb_build_object('mine', (select entry_id from public.challenge_votes where challenge_id = c.id and voter_id = v_uid));
end;
$$;
grant execute on function public.set_challenge_vote(uuid, uuid) to authenticated;

-- Entries with vote counts. Hidden submissions are excluded; entries by people the viewer blocks are excluded.
create or replace function public.challenge_board(p_challenge uuid)
returns table (entry_id uuid, user_id uuid, username text, display_name text, avatar_url text,
  meme_id uuid, meme_caption text, meme_image_url text, meme_joke text,
  variation_id uuid, variation_title text, variation_rules text, cocktail_id uuid, cocktail_name text,
  votes bigint, created_at timestamptz, my_vote boolean, can_vote boolean)
language sql stable security definer set search_path = public as $$
  select e.id, e.user_id, p.username, p.display_name, p.avatar_url,
    m.id, m.caption, m.image_url, m.joke_text,
    v.id, v.title, v.rules, ck.id, ck.name,
    (select count(*) from public.challenge_votes cv where cv.entry_id = e.id),
    e.created_at,
    exists (select 1 from public.challenge_votes cv where cv.entry_id = e.id and cv.voter_id = (select auth.uid())),
    (select auth.uid()) is not null and e.user_id <> (select auth.uid()) and not public.blocked_by(e.user_id)
  from public.challenge_entries e
  join public.profiles p on p.id = e.user_id
  left join public.memes m on m.id = e.meme_id
  left join public.cocktail_variations v on v.id = e.cocktail_variation_id
  left join public.cocktails ck on ck.id = v.cocktail_id
  where e.challenge_id = p_challenge
    and private.entry_visible(e)
    and not public.i_block(e.user_id)
  order by 15 desc, e.created_at asc;
$$;
grant execute on function public.challenge_board(uuid) to anon, authenticated;

-- Winner of an ended challenge: most votes (> 0) among visible entries, earliest entry wins ties.
create or replace function public.challenge_winner(p_challenge uuid)
returns table (entry_id uuid, user_id uuid, username text, votes bigint)
language sql stable security definer set search_path = public as $$
  select e.id, e.user_id, p.username, count(cv.voter_id) as votes
  from public.challenges c
  join public.challenge_entries e on e.challenge_id = c.id
  join public.profiles p on p.id = e.user_id
  join public.challenge_votes cv on cv.entry_id = e.id
  where c.id = p_challenge and now() >= public.challenge_ends_at(c.starts_on) and private.entry_visible(e)
  group by e.id, e.user_id, p.username, e.created_at
  order by count(cv.voter_id) desc, e.created_at asc
  limit 1;
$$;
grant execute on function public.challenge_winner(uuid) to anon, authenticated;

create or replace function public.user_challenge_wins(p_user uuid)
returns table (challenge_id uuid, theme text, starts_on date, votes bigint)
language sql stable security definer set search_path = public as $$
  select c.id, c.theme, c.starts_on, w.votes
  from public.challenges c
  cross join lateral public.challenge_winner(c.id) w
  where now() >= public.challenge_ends_at(c.starts_on)
    and exists (select 1 from public.challenge_entries e where e.challenge_id = c.id and e.user_id = p_user)
    and w.user_id = p_user
  order by c.starts_on desc;
$$;
grant execute on function public.user_challenge_wins(uuid) to anon, authenticated;

revoke execute on function private.challenge_open(public.challenges) from public;
revoke execute on function private.entry_visible(public.challenge_entries) from public;
