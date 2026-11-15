-- 0037: second batch of "SECURITY DEFINER function executable by anon/authenticated" advisor warnings.
-- Same pattern as 0036: the privileged body moves to schema private (not served by the Data API) as
-- SECURITY DEFINER with search_path = '' and schema-qualified names; the public function keeps its name,
-- signature and defaults as a thin SECURITY INVOKER wrapper, so app .rpc() calls, RLS policies, storage
-- policies and triggers that call public.<name>() keep working unchanged. Private bodies call the private
-- versions of the helpers directly (meme_stats -> private.is_admin, top_memes / set_challenge_vote ->
-- private.i_block / private.blocked_by).
--
-- RLS helpers (is_admin, i_block, blocked_by, meme_visible, parent_*) are evaluated as the querying role,
-- so that role needs EXECUTE on both the public wrapper and the private body (USAGE on private: 0036).
-- Roles mirror today's grants, minus the PUBLIC grant on is_admin:
--   guests + members : is_admin, i_block, parent_readable (SELECT policies "to public"), meme_stats,
--                      top_memes, profile_reaction_totals (guest pages), submit_public_report (public
--                      report form, refused without AUTH_THROTTLE_SECRET)
--   members only     : blocked_by, meme_visible, parent_author, parent_visible x2 (INSERT/UPDATE policies),
--                      my_profile, my_terms_version, accept_terms, mark_notifications_read,
--                      delete_my_account, grant_upload (secret-gated), enter_challenge, set_challenge_vote
--   service_role     : everything (server scripts, guard triggers under service_role)
-- Policies are not rewritten: they keep calling public.<name>(), now an invoker wrapper.
begin;

-- ── 1. private SECURITY DEFINER implementations (bodies as live, fully qualified) ─────────
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false);
$$;

create or replace function private.i_block(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_user is not null and exists (select 1 from public.blocks b where b.blocker_id = (select auth.uid()) and b.blocked_id = p_user);
$$;

create or replace function private.blocked_by(p_owner uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_owner is not null and exists (select 1 from public.blocks b where b.blocker_id = p_owner and b.blocked_id = (select auth.uid()));
$$;

create or replace function private.meme_visible(p_meme uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memes m where m.id = p_meme and not m.is_hidden);
$$;

create or replace function private.parent_author(p_game uuid, p_cocktail uuid, p_meme uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select case
    when p_game is not null then (select g.author_id from public.games g where g.id = p_game)
    when p_cocktail is not null then (select c.author_id from public.cocktails c where c.id = p_cocktail)
    when p_meme is not null then (select m.author_id from public.memes m where m.id = p_meme)
  end;
$$;

create or replace function private.parent_readable(p_game uuid, p_cocktail uuid, p_meme uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_game is not null then exists (select 1 from public.games g where g.id = p_game
                                          and (not g.is_hidden or g.author_id = (select auth.uid())))
    when p_cocktail is not null then exists (select 1 from public.cocktails c where c.id = p_cocktail
                                          and (not c.is_hidden or c.author_id = (select auth.uid())))
    when p_meme is not null then exists (select 1 from public.memes m where m.id = p_meme
                                          and (not m.is_hidden or m.author_id = (select auth.uid())))
    else false end;
$$;

create or replace function private.parent_visible(p_game uuid, p_cocktail uuid, p_meme uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_game is not null then exists (select 1 from public.games g where g.id = p_game and not g.is_hidden)
    when p_cocktail is not null then exists (select 1 from public.cocktails c where c.id = p_cocktail and not c.is_hidden)
    when p_meme is not null then exists (select 1 from public.memes m where m.id = p_meme and not m.is_hidden)
    else false end;
$$;

create or replace function private.parent_visible(p_game uuid, p_cocktail uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_game is not null then exists (select 1 from public.games g where g.id = p_game and not g.is_hidden)
    when p_cocktail is not null then exists (select 1 from public.cocktails c where c.id = p_cocktail and not c.is_hidden)
    else false end;
$$;

create or replace function private.meme_stats(p_ids uuid[])
returns table(meme_id uuid, reactions jsonb, mine text, comment_count bigint) language sql stable security definer set search_path = '' as $$
  select m.id,
         coalesce((select jsonb_object_agg(e.emoji, e.n) from (
           select r.emoji, count(*) n from public.meme_reactions r where r.meme_id = m.id group by r.emoji) e), '{}'::jsonb),
         (select r.emoji from public.meme_reactions r where r.meme_id = m.id and r.user_id = (select auth.uid())),
         (select count(*) from public.comments c where c.meme_id = m.id and not c.is_hidden)
  from public.memes m
  where m.id = any(p_ids[1:100])
    and (not m.is_hidden or m.author_id = (select auth.uid()) or private.is_admin());
$$;

create or replace function private.top_memes(p_since timestamptz, p_offset integer, p_limit integer)
returns table(id uuid, reaction_count bigint) language sql stable security definer set search_path = '' as $$
  select m.id, m.reaction_count::bigint
  from public.memes m
  where not m.is_hidden and (p_since is null or m.created_at >= p_since) and not private.i_block(m.author_id)
  order by m.reaction_count desc, m.created_at desc
  offset greatest(p_offset, 0) limit least(greatest(p_limit, 1), 101);
$$;

create or replace function private.profile_reaction_totals(p_user uuid)
returns table(emoji text, n bigint) language sql stable security definer set search_path = '' as $$
  select r.emoji, count(*)
  from public.meme_reactions r
  join public.memes m on m.id = r.meme_id
  where m.author_id = p_user and not m.is_hidden
  group by r.emoji;
$$;

create or replace function private.submit_public_report(p_secret text, p_target_type text, p_target_id uuid, p_target_url text, p_reason text, p_note text, p_email text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_secret is null or p_secret is distinct from (select c.value from private.app_config c where c.key = 'auth_throttle_secret') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.reports (reporter_id, target_type, target_id, target_url, reason, note, reporter_email)
  values (auth.uid(), p_target_type, p_target_id, nullif(btrim(p_target_url), ''), p_reason,
          nullif(btrim(p_note), ''), nullif(lower(btrim(p_email)), ''))
  on conflict (reporter_id, target_type, target_id) do update set note = coalesce(excluded.note, public.reports.note)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function private.my_profile()
returns setof public.profiles language sql stable security definer set search_path = '' as $$
  select * from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function private.my_terms_version()
returns text language sql stable security definer set search_path = '' as $$
  select p.accepted_terms_version from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function private.accept_terms(p_version text)
returns timestamptz language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_at timestamptz := now();
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if p_version is null or p_version !~ '^[0-9A-Za-z._-]{1,40}$' then raise exception 'bad_version' using errcode = '22023'; end if;
  update public.profiles set accepted_terms_at = v_at, accepted_terms_version = p_version where id = v_uid;
  if not found then raise exception 'no_profile' using errcode = 'P0002'; end if;
  return v_at;
end;
$$;

create or replace function private.mark_notifications_read(p_ids uuid[])
returns void language sql volatile security definer set search_path = '' as $$
  update public.notifications set read_at = now()
  where user_id = (select auth.uid()) and read_at is null and (p_ids is null or id = any(p_ids));
$$;

create or replace function private.delete_my_account()
returns void language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_admin) then
    raise exception 'admin_account' using errcode = 'P0001';
  end if;
  delete from public.cocktails where author_id = v_uid; -- FK is ON DELETE SET NULL, but the user's own posts go too
  delete from private.upload_grants where user_id = v_uid;
  delete from auth.users where id = v_uid;
end;
$$;

create or replace function private.grant_upload(p_secret text, p_bucket text, p_name text, p_bytes integer)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_count int;
  v_bytes bigint;
begin
  if p_secret is null or p_secret is distinct from (select c.value from private.app_config c where c.key = 'auth_throttle_secret') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_uid is null or p_bucket not in ('avatars', 'game-covers', 'memes', 'cocktails')
     or p_name is null or p_name not like v_uid::text || '/%' or p_name like '%/%/%'
     or p_bytes is null or p_bytes <= 0 or p_bytes > 4194304 then
    raise exception 'bad upload' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('upload_grant:' || v_uid::text));
  delete from private.upload_grants where created_at < now() - interval '2 days';
  select count(*), coalesce(sum(g.bytes), 0) into v_count, v_bytes
    from private.upload_grants g where g.user_id = v_uid and g.created_at > now() - interval '24 hours';
  if v_count >= 20 or v_bytes + p_bytes > 41943040 then
    raise exception 'upload_quota' using errcode = 'P0001';
  end if;
  insert into private.upload_grants (bucket, name, user_id, bytes) values (p_bucket, p_name, v_uid, p_bytes);
end;
$$;

create or replace function private.enter_challenge(p_challenge uuid, p_submission uuid)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); c public.challenges; v_id uuid;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into c from public.challenges where id = p_challenge;
  if not found then raise exception 'challenge_not_found' using errcode = 'P0002'; end if;
  if not private.challenge_open(c) then raise exception 'challenge_closed' using errcode = 'P0001'; end if;
  perform private.challenge_rate_ok(v_uid);
  if c.kind = 'meme' then
    if not exists (select 1 from public.memes m where m.id = p_submission and m.author_id = v_uid and not m.is_hidden) then
      raise exception 'not_your_submission' using errcode = '42501'; end if;
    insert into public.challenge_entries (challenge_id, user_id, meme_id) values (c.id, v_uid, p_submission)
    on conflict (challenge_id, user_id) do nothing returning id into v_id;
  else
    if not exists (select 1 from public.cocktail_variations v where v.id = p_submission and v.author_id = v_uid and not v.is_hidden) then
      raise exception 'not_your_submission' using errcode = '42501'; end if;
    insert into public.challenge_entries (challenge_id, user_id, cocktail_variation_id) values (c.id, v_uid, p_submission)
    on conflict (challenge_id, user_id) do nothing returning id into v_id;
  end if;
  if v_id is null then raise exception 'already_entered' using errcode = '23505'; end if;
  return v_id;
end;
$$;

create or replace function private.set_challenge_vote(p_challenge uuid, p_entry uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
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
    if private.i_block(e.user_id) or private.blocked_by(e.user_id) then raise exception 'blocked' using errcode = '42501'; end if;
    insert into public.challenge_votes (challenge_id, voter_id, entry_id) values (c.id, v_uid, e.id)
    on conflict (challenge_id, voter_id) do update set entry_id = excluded.entry_id, created_at = now()
      where public.challenge_votes.entry_id is distinct from excluded.entry_id;
  end if;
  return jsonb_build_object('mine', (select cv.entry_id from public.challenge_votes cv where cv.challenge_id = c.id and cv.voter_id = v_uid));
end;
$$;

-- ── 2. public wrappers: same names, signatures and defaults, now SECURITY INVOKER ──────────
create or replace function public.is_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.is_admin();
$$;

create or replace function public.i_block(p_user uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.i_block(p_user);
$$;

create or replace function public.blocked_by(p_owner uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.blocked_by(p_owner);
$$;

create or replace function public.meme_visible(p_meme uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.meme_visible(p_meme);
$$;

create or replace function public.parent_author(p_game uuid, p_cocktail uuid, p_meme uuid)
returns uuid language sql stable security invoker set search_path = '' as $$
  select private.parent_author(p_game, p_cocktail, p_meme);
$$;

create or replace function public.parent_readable(p_game uuid, p_cocktail uuid, p_meme uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.parent_readable(p_game, p_cocktail, p_meme);
$$;

create or replace function public.parent_visible(p_game uuid, p_cocktail uuid, p_meme uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.parent_visible(p_game, p_cocktail, p_meme);
$$;

create or replace function public.parent_visible(p_game uuid, p_cocktail uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select private.parent_visible(p_game, p_cocktail);
$$;

create or replace function public.meme_stats(p_ids uuid[])
returns table(meme_id uuid, reactions jsonb, mine text, comment_count bigint) language sql stable security invoker set search_path = '' as $$
  select * from private.meme_stats(p_ids);
$$;

create or replace function public.top_memes(p_since timestamptz default null, p_offset integer default 0, p_limit integer default 25)
returns table(id uuid, reaction_count bigint) language sql stable security invoker set search_path = '' as $$
  select * from private.top_memes(p_since, p_offset, p_limit);
$$;

create or replace function public.profile_reaction_totals(p_user uuid)
returns table(emoji text, n bigint) language sql stable security invoker set search_path = '' as $$
  select * from private.profile_reaction_totals(p_user);
$$;

create or replace function public.submit_public_report(p_secret text, p_target_type text, p_target_id uuid, p_target_url text, p_reason text, p_note text, p_email text)
returns uuid language sql volatile security invoker set search_path = '' as $$
  select private.submit_public_report(p_secret, p_target_type, p_target_id, p_target_url, p_reason, p_note, p_email);
$$;

create or replace function public.my_profile()
returns setof public.profiles language sql stable security invoker set search_path = '' as $$
  select * from private.my_profile();
$$;

create or replace function public.my_terms_version()
returns text language sql stable security invoker set search_path = '' as $$
  select private.my_terms_version();
$$;

create or replace function public.accept_terms(p_version text)
returns timestamptz language sql volatile security invoker set search_path = '' as $$
  select private.accept_terms(p_version);
$$;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void language sql volatile security invoker set search_path = '' as $$
  select private.mark_notifications_read(p_ids);
$$;

create or replace function public.delete_my_account()
returns void language sql volatile security invoker set search_path = '' as $$
  select private.delete_my_account();
$$;

create or replace function public.grant_upload(p_secret text, p_bucket text, p_name text, p_bytes integer)
returns void language sql volatile security invoker set search_path = '' as $$
  select private.grant_upload(p_secret, p_bucket, p_name, p_bytes);
$$;

create or replace function public.enter_challenge(p_challenge uuid, p_submission uuid)
returns uuid language sql volatile security invoker set search_path = '' as $$
  select private.enter_challenge(p_challenge, p_submission);
$$;

create or replace function public.set_challenge_vote(p_challenge uuid, p_entry uuid)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select private.set_challenge_vote(p_challenge, p_entry);
$$;

-- ── 3. grants, by name (default privileges re-grant EXECUTE to anon on new public functions) ─
revoke execute on function
  private.is_admin(),
  public.is_admin(),
  private.i_block(uuid),
  public.i_block(uuid),
  private.blocked_by(uuid),
  public.blocked_by(uuid),
  private.meme_visible(uuid),
  public.meme_visible(uuid),
  private.parent_author(uuid, uuid, uuid),
  public.parent_author(uuid, uuid, uuid),
  private.parent_readable(uuid, uuid, uuid),
  public.parent_readable(uuid, uuid, uuid),
  private.parent_visible(uuid, uuid, uuid),
  public.parent_visible(uuid, uuid, uuid),
  private.parent_visible(uuid, uuid),
  public.parent_visible(uuid, uuid),
  private.meme_stats(uuid[]),
  public.meme_stats(uuid[]),
  private.top_memes(timestamptz, integer, integer),
  public.top_memes(timestamptz, integer, integer),
  private.profile_reaction_totals(uuid),
  public.profile_reaction_totals(uuid),
  private.submit_public_report(text, text, uuid, text, text, text, text),
  public.submit_public_report(text, text, uuid, text, text, text, text),
  private.my_profile(),
  public.my_profile(),
  private.my_terms_version(),
  public.my_terms_version(),
  private.accept_terms(text),
  public.accept_terms(text),
  private.mark_notifications_read(uuid[]),
  public.mark_notifications_read(uuid[]),
  private.delete_my_account(),
  public.delete_my_account(),
  private.grant_upload(text, text, text, integer),
  public.grant_upload(text, text, text, integer),
  private.enter_challenge(uuid, uuid),
  public.enter_challenge(uuid, uuid),
  private.set_challenge_vote(uuid, uuid),
  public.set_challenge_vote(uuid, uuid)
from public, anon, authenticated;

-- guests and members
grant execute on function
  private.is_admin(),
  public.is_admin(),
  private.i_block(uuid),
  public.i_block(uuid),
  private.parent_readable(uuid, uuid, uuid),
  public.parent_readable(uuid, uuid, uuid),
  private.meme_stats(uuid[]),
  public.meme_stats(uuid[]),
  private.top_memes(timestamptz, integer, integer),
  public.top_memes(timestamptz, integer, integer),
  private.profile_reaction_totals(uuid),
  public.profile_reaction_totals(uuid),
  private.submit_public_report(text, text, uuid, text, text, text, text),
  public.submit_public_report(text, text, uuid, text, text, text, text)
to anon, authenticated;

-- signed-in only
grant execute on function
  private.blocked_by(uuid),
  public.blocked_by(uuid),
  private.meme_visible(uuid),
  public.meme_visible(uuid),
  private.parent_author(uuid, uuid, uuid),
  public.parent_author(uuid, uuid, uuid),
  private.parent_visible(uuid, uuid, uuid),
  public.parent_visible(uuid, uuid, uuid),
  private.parent_visible(uuid, uuid),
  public.parent_visible(uuid, uuid),
  private.my_profile(),
  public.my_profile(),
  private.my_terms_version(),
  public.my_terms_version(),
  private.accept_terms(text),
  public.accept_terms(text),
  private.mark_notifications_read(uuid[]),
  public.mark_notifications_read(uuid[]),
  private.delete_my_account(),
  public.delete_my_account(),
  private.grant_upload(text, text, text, integer),
  public.grant_upload(text, text, text, integer),
  private.enter_challenge(uuid, uuid),
  public.enter_challenge(uuid, uuid),
  private.set_challenge_vote(uuid, uuid),
  public.set_challenge_vote(uuid, uuid)
to authenticated;

grant execute on function
  private.is_admin(),
  public.is_admin(),
  private.i_block(uuid),
  public.i_block(uuid),
  private.blocked_by(uuid),
  public.blocked_by(uuid),
  private.meme_visible(uuid),
  public.meme_visible(uuid),
  private.parent_author(uuid, uuid, uuid),
  public.parent_author(uuid, uuid, uuid),
  private.parent_readable(uuid, uuid, uuid),
  public.parent_readable(uuid, uuid, uuid),
  private.parent_visible(uuid, uuid, uuid),
  public.parent_visible(uuid, uuid, uuid),
  private.parent_visible(uuid, uuid),
  public.parent_visible(uuid, uuid),
  private.meme_stats(uuid[]),
  public.meme_stats(uuid[]),
  private.top_memes(timestamptz, integer, integer),
  public.top_memes(timestamptz, integer, integer),
  private.profile_reaction_totals(uuid),
  public.profile_reaction_totals(uuid),
  private.submit_public_report(text, text, uuid, text, text, text, text),
  public.submit_public_report(text, text, uuid, text, text, text, text),
  private.my_profile(),
  public.my_profile(),
  private.my_terms_version(),
  public.my_terms_version(),
  private.accept_terms(text),
  public.accept_terms(text),
  private.mark_notifications_read(uuid[]),
  public.mark_notifications_read(uuid[]),
  private.delete_my_account(),
  public.delete_my_account(),
  private.grant_upload(text, text, text, integer),
  public.grant_upload(text, text, text, integer),
  private.enter_challenge(uuid, uuid),
  public.enter_challenge(uuid, uuid),
  private.set_challenge_vote(uuid, uuid),
  public.set_challenge_vote(uuid, uuid)
to service_role;

commit;
