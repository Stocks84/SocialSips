-- 0040: suspend accounts (UK OSA risk assessment gap G3; Terms section "we may suspend accounts").
--
-- A suspended member can still sign in, read, delete their own posts and delete their account
-- (UK GDPR / data-subject rights stay intact), but cannot publish or interact:
--   create/edit  games, cocktails, memes, comments, game + cocktail variations, own profile text/avatar
--   interact     ratings, meme reactions, follows, challenge entries + votes, in-app reports, image uploads
-- Blocking is done by one BEFORE INSERT/UPDATE trigger (private.block_if_suspended) on each table, so it
-- also covers the SECURITY DEFINER RPCs (enter_challenge, set_challenge_vote, submit_public_report,
-- grant_upload, set_reaction) without rewriting their bodies. The trigger raises 'account_suspended'.
--
-- Who can change it:
--   * profiles.suspended_at / suspension_reason have NO column grants for anon/authenticated (profiles uses
--     column-level UPDATE grants since 0017/0028), so a member cannot read or edit them through the API.
--   * Admins use public.set_account_suspension() (private SECURITY DEFINER body, admin-checked inside).
--   * Guards: an admin account can't be suspended (CHECK constraint + RPC check), nor can you suspend yourself.
--   * Members read their own status via public.my_suspension() (for the "account suspended" message).
-- Pattern follows 0036/0037: private SECURITY DEFINER body (search_path = ''), thin public SECURITY INVOKER
-- wrapper, grants set by name (default privileges would otherwise re-grant EXECUTE to anon).
begin;

-- ── 1. Columns + guards ──────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text;

alter table public.profiles drop constraint if exists profiles_suspension_reason_len;
alter table public.profiles add constraint profiles_suspension_reason_len
  check (char_length(suspension_reason) <= 500);
alter table public.profiles drop constraint if exists profiles_reason_needs_suspension;
alter table public.profiles add constraint profiles_reason_needs_suspension
  check (suspension_reason is null or suspended_at is not null);
alter table public.profiles drop constraint if exists profiles_admin_not_suspended;
alter table public.profiles add constraint profiles_admin_not_suspended
  check (not (is_admin and suspended_at is not null));

-- Explicit (a new column gets no grants, this just documents it and survives a future table-level grant).
revoke select (suspended_at, suspension_reason), update (suspended_at, suspension_reason)
  on public.profiles from anon, authenticated;

-- ── 2. Helpers ───────────────────────────────────────────────────────────────
create or replace function private.is_suspended()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.suspended_at is not null and not p.is_admin
                   from public.profiles p where p.id = (select auth.uid())), false);
$$;

create or replace function private.my_suspension()
returns table (suspended_at timestamptz, reason text)
language sql stable security definer set search_path = '' as $$
  select p.suspended_at, p.suspension_reason
  from public.profiles p
  where p.id = (select auth.uid()) and p.suspended_at is not null and not p.is_admin;
$$;

create or replace function public.my_suspension()
returns table (suspended_at timestamptz, reason text)
language sql stable security invoker set search_path = '' as $$
  select * from private.my_suspension();
$$;

-- Trigger function: SECURITY DEFINER so the firing role needs no extra grants (privileges on a trigger
-- function are only checked when the trigger is created).
create or replace function private.block_if_suspended()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if private.is_suspended() then
    raise exception 'account_suspended' using errcode = '42501', hint = 'account_suspended';
  end if;
  return new;
end;
$$;

-- ── 3. Admin controls ────────────────────────────────────────────────────────
create or replace function private.set_account_suspension(p_user uuid, p_suspended boolean, p_reason text default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare v_is_admin boolean;
begin
  if not private.is_admin() then
    raise exception 'admins_only' using errcode = '42501';
  end if;
  if p_user is null or p_user = (select auth.uid()) then
    raise exception 'cannot_suspend_self' using errcode = 'P0001';
  end if;
  select p.is_admin into v_is_admin from public.profiles p where p.id = p_user;
  if not found then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
  if p_suspended and v_is_admin then
    raise exception 'cannot_suspend_admin' using errcode = 'P0001';
  end if;
  update public.profiles p set
    suspended_at = case when p_suspended then coalesce(p.suspended_at, now()) else null end,
    suspension_reason = case when p_suspended then nullif(left(btrim(coalesce(p_reason, '')), 500), '') else null end
  where p.id = p_user;
end;
$$;

create or replace function public.set_account_suspension(p_user uuid, p_suspended boolean, p_reason text default null)
returns void language sql volatile security invoker set search_path = '' as $$
  select private.set_account_suspension(p_user, p_suspended, p_reason);
$$;

-- With a username prefix: matching accounts. With nothing: the currently suspended accounts.
create or replace function private.admin_list_users(p_query text default null)
returns table (id uuid, username text, is_admin boolean, suspended_at timestamptz, suspension_reason text)
language plpgsql stable security definer set search_path = '' as $$
declare v_q text := lower(btrim(coalesce(p_query, '')));
begin
  if not private.is_admin() then
    raise exception 'admins_only' using errcode = '42501';
  end if;
  return query
    select p.id, p.username, p.is_admin, p.suspended_at, p.suspension_reason
    from public.profiles p
    where case when v_q = '' then p.suspended_at is not null else starts_with(lower(p.username), v_q) end
    order by (p.suspended_at is null), p.username
    limit 25;
end;
$$;

create or replace function public.admin_list_users(p_query text default null)
returns table (id uuid, username text, is_admin boolean, suspended_at timestamptz, suspension_reason text)
language sql stable security invoker set search_path = '' as $$
  select * from private.admin_list_users(p_query);
$$;

revoke execute on function
  private.is_suspended(), private.my_suspension(), public.my_suspension(),
  private.block_if_suspended(),
  private.set_account_suspension(uuid, boolean, text), public.set_account_suspension(uuid, boolean, text),
  private.admin_list_users(text), public.admin_list_users(text)
from public, anon, authenticated;
-- members (admins are members too; the admin check is inside the functions)
grant execute on function
  private.my_suspension(), public.my_suspension(),
  private.set_account_suspension(uuid, boolean, text), public.set_account_suspension(uuid, boolean, text),
  private.admin_list_users(text), public.admin_list_users(text)
to authenticated;
grant execute on function
  private.is_suspended(), private.my_suspension(), public.my_suspension(),
  private.block_if_suspended(),
  private.set_account_suspension(uuid, boolean, text), public.set_account_suspension(uuid, boolean, text),
  private.admin_list_users(text), public.admin_list_users(text)
to service_role;

-- ── 4. Enforcement triggers ──────────────────────────────────────────────────
do $$
declare t text;
begin
  -- create + edit
  foreach t in array array['games', 'cocktails', 'memes', 'comments', 'game_variations', 'cocktail_variations',
                           'ratings', 'meme_reactions', 'challenge_entries', 'challenge_votes'] loop
    execute format('drop trigger if exists aa_block_suspended on public.%I', t);
    execute format('create trigger aa_block_suspended before insert or update on public.%I
                    for each row execute function private.block_if_suspended()', t);
  end loop;
  -- create only
  foreach t in array array['follows', 'reports'] loop
    execute format('drop trigger if exists aa_block_suspended on public.%I', t);
    execute format('create trigger aa_block_suspended before insert on public.%I
                    for each row execute function private.block_if_suspended()', t);
  end loop;
end $$;

-- Image uploads (grant_upload writes here first, so a suspended member can't upload anything).
drop trigger if exists aa_block_suspended on private.upload_grants;
create trigger aa_block_suspended before insert on private.upload_grants
  for each row execute function private.block_if_suspended();

-- Public profile text + avatar (only when one of those columns is in the UPDATE; accept_terms etc. still work).
drop trigger if exists aa_block_suspended on public.profiles;
create trigger aa_block_suspended before update of display_name, bio, avatar_url, favourite_drink, party_vibe
  on public.profiles for each row execute function private.block_if_suspended();

commit;
