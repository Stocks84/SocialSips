-- 0036: clear the "SECURITY DEFINER function executable by anon/authenticated" advisor warnings
-- and the "RLS enabled, no policies" notices.
--
-- Pattern: the privileged body moves to the private schema (not exposed by the Data API / PostgREST),
-- keeps SECURITY DEFINER and gets `search_path = ''` with every name schema-qualified. The public
-- function of the same name becomes a thin SECURITY INVOKER wrapper, so the app's .rpc() calls and
-- the storage policy keep working unchanged. Each function is executable only by the roles that use it.
--
--   function                    who calls it                                  roles after
--   auth_throttle_ok/_fail      sign-in server action, anon-key client,       anon, authenticated
--                               refused without AUTH_THROTTLE_SECRET
--   current_challenge           /challenge, also for guests (creates the week) anon, authenticated
--   challenge_board             /challenge board, also for guests             anon, authenticated
--   challenge_winner            /challenge (ended), also for guests           anon, authenticated
--   user_challenge_wins         profile page, also for guests                 anon, authenticated
--   withdraw_challenge_entry    challenge server action, signed in            authenticated
--   upload_granted              storage.objects INSERT policy, signed in      authenticated
--
-- The wrappers need USAGE on schema private. That is safe because PostgREST only serves public and
-- graphql_public, no private table is granted to anon/authenticated, and this migration revokes
-- anon/authenticated EXECUTE on every older private function first (none of them is used by an RLS
-- policy; trigger functions don't need EXECUTE for the user firing the trigger).
-- Default privileges re-grant EXECUTE to anon on new public functions, so grants are set by name.
begin;

-- ── 0. lock down existing private functions before granting schema usage ─────────
do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'private' and p.prokind = 'f'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end $$;

-- ── 1. private SECURITY DEFINER implementations (bodies as live, fully qualified) ─
create or replace function private.auth_throttle_ok(p_secret text, p_keys text[])
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  if p_secret is null or p_secret is distinct from (select value from private.app_config where key = 'auth_throttle_secret') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return not exists (
    select 1 from unnest(p_keys[1:3]) k
    where (select count(*) from public.auth_attempts a
           where a.key_hash = encode(extensions.digest(k, 'sha256'), 'hex')
             and a.created_at > now() - interval '15 minutes')
          >= case when k like 'ip:%' then 30 else 10 end
  );
end;
$$;

create or replace function private.auth_throttle_fail(p_secret text, p_keys text[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_secret is null or p_secret is distinct from (select value from private.app_config where key = 'auth_throttle_secret') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.auth_attempts where created_at < now() - interval '1 day';
  insert into public.auth_attempts (key_hash)
    select encode(extensions.digest(k, 'sha256'), 'hex') from unnest(p_keys[1:3]) k;
end;
$$;

create or replace function private.current_challenge()
returns setof public.challenges language plpgsql security definer set search_path = '' as $$
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
  if exists (select 1 from public.challenges where winner_notified_at is null and starts_on < v_week and starts_on >= v_week - 56) then
    perform private.notify_challenge_winners();
  end if;
  return query select * from public.challenges where starts_on = v_week;
end;
$$;

create or replace function private.challenge_board(p_challenge uuid)
returns table(entry_id uuid, user_id uuid, username text, display_name text, avatar_url text, meme_id uuid, meme_caption text, meme_image_url text, meme_joke text, variation_id uuid, variation_title text, variation_rules text, cocktail_id uuid, cocktail_name text, votes bigint, created_at timestamptz, my_vote boolean, can_vote boolean)
language sql stable security definer set search_path = '' as $$
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

create or replace function private.challenge_winner(p_challenge uuid)
returns table(entry_id uuid, user_id uuid, username text, votes bigint)
language sql stable security definer set search_path = '' as $$
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

create or replace function private.user_challenge_wins(p_user uuid)
returns table(challenge_id uuid, theme text, starts_on date, votes bigint)
language sql stable security definer set search_path = '' as $$
  select c.id, c.theme, c.starts_on, w.votes
  from public.challenges c
  cross join lateral private.challenge_winner(c.id) w
  where now() >= public.challenge_ends_at(c.starts_on)
    and exists (select 1 from public.challenge_entries e where e.challenge_id = c.id and e.user_id = p_user)
    and w.user_id = p_user
  order by c.starts_on desc;
$$;

create or replace function private.withdraw_challenge_entry(p_challenge uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); c public.challenges;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into c from public.challenges where id = p_challenge;
  if not found or not private.challenge_open(c) then raise exception 'challenge_closed' using errcode = 'P0001'; end if;
  perform private.challenge_rate_ok(v_uid);
  delete from public.challenge_entries where challenge_id = c.id and user_id = v_uid;
end;
$$;

create or replace function private.upload_granted(p_bucket text, p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.upload_grants g
                 where g.bucket = p_bucket and g.name = p_name and g.user_id = (select auth.uid())
                   and g.created_at > now() - interval '10 minutes');
$$;

-- ── 2. public wrappers: same names and signatures, now SECURITY INVOKER ───────────
create or replace function public.auth_throttle_ok(p_secret text, p_keys text[])
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.auth_throttle_ok(p_secret, p_keys);
$$;

create or replace function public.auth_throttle_fail(p_secret text, p_keys text[])
returns void language sql volatile security invoker set search_path = '' as $$
  select private.auth_throttle_fail(p_secret, p_keys);
$$;

create or replace function public.current_challenge()
returns setof public.challenges language sql volatile security invoker set search_path = '' as $$
  select * from private.current_challenge();
$$;

create or replace function public.challenge_board(p_challenge uuid)
returns table(entry_id uuid, user_id uuid, username text, display_name text, avatar_url text, meme_id uuid, meme_caption text, meme_image_url text, meme_joke text, variation_id uuid, variation_title text, variation_rules text, cocktail_id uuid, cocktail_name text, votes bigint, created_at timestamptz, my_vote boolean, can_vote boolean)
language sql stable security invoker set search_path = '' as $$
  select * from private.challenge_board(p_challenge);
$$;

create or replace function public.challenge_winner(p_challenge uuid)
returns table(entry_id uuid, user_id uuid, username text, votes bigint)
language sql stable security invoker set search_path = '' as $$
  select * from private.challenge_winner(p_challenge);
$$;

create or replace function public.user_challenge_wins(p_user uuid)
returns table(challenge_id uuid, theme text, starts_on date, votes bigint)
language sql stable security invoker set search_path = '' as $$
  select * from private.user_challenge_wins(p_user);
$$;

create or replace function public.withdraw_challenge_entry(p_challenge uuid)
returns void language sql volatile security invoker set search_path = '' as $$
  select private.withdraw_challenge_entry(p_challenge);
$$;

create or replace function public.upload_granted(p_bucket text, p_name text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.upload_granted(p_bucket, p_name);
$$;

-- ── 3. grants, by name ───────────────────────────────────────────────────────────
grant usage on schema private to anon, authenticated, service_role;

revoke execute on function
  private.auth_throttle_ok(text, text[]), private.auth_throttle_fail(text, text[]),
  private.current_challenge(), private.challenge_board(uuid), private.challenge_winner(uuid),
  private.user_challenge_wins(uuid), private.withdraw_challenge_entry(uuid), private.upload_granted(text, text),
  public.auth_throttle_ok(text, text[]), public.auth_throttle_fail(text, text[]),
  public.current_challenge(), public.challenge_board(uuid), public.challenge_winner(uuid),
  public.user_challenge_wins(uuid), public.withdraw_challenge_entry(uuid), public.upload_granted(text, text)
from public, anon, authenticated;

-- guests and members (secret-gated throttle; public challenge pages)
grant execute on function
  private.auth_throttle_ok(text, text[]), private.auth_throttle_fail(text, text[]),
  private.current_challenge(), private.challenge_board(uuid), private.challenge_winner(uuid),
  private.user_challenge_wins(uuid),
  public.auth_throttle_ok(text, text[]), public.auth_throttle_fail(text, text[]),
  public.current_challenge(), public.challenge_board(uuid), public.challenge_winner(uuid),
  public.user_challenge_wins(uuid)
to anon, authenticated;

-- signed-in only
grant execute on function
  private.withdraw_challenge_entry(uuid), private.upload_granted(text, text),
  public.withdraw_challenge_entry(uuid), public.upload_granted(text, text)
to authenticated;

grant execute on function
  private.auth_throttle_ok(text, text[]), private.auth_throttle_fail(text, text[]),
  private.current_challenge(), private.challenge_board(uuid), private.challenge_winner(uuid),
  private.user_challenge_wins(uuid), private.withdraw_challenge_entry(uuid), private.upload_granted(text, text)
to service_role;

-- ── 4. auth_attempts / reaction_rate: deny-all is intended, say so explicitly ─────
-- Only the owner (postgres: the SECURITY DEFINER throttle functions and the limit_reactions trigger)
-- and service_role touch these tables; anon/authenticated have no table grants. A RESTRICTIVE
-- false policy documents that, silences "RLS enabled, no policies", and still denies everything
-- if a future default-privilege grant ever hands these roles table rights.
create policy "no api access" on public.auth_attempts as restrictive for all to anon, authenticated using (false) with check (false);
create policy "no api access" on public.reaction_rate as restrictive for all to anon, authenticated using (false) with check (false);
comment on table public.auth_attempts is 'Failed sign-in attempts (hashed keys). Written/read only by private.auth_throttle_* (SECURITY DEFINER) and service_role; RLS deny-all for API roles is intended.';
comment on table public.reaction_rate is 'Per-user reaction rate window. Written only by the limit_reactions trigger (SECURITY DEFINER) and service_role; RLS deny-all for API roles is intended.';

commit;
