-- Social Sips — medium fixes from the 2026-10-19 Claude review.
--  1. Comments, variations, ratings (and meme reactions) are only readable when the parent post is readable
--     to the viewer (parent not hidden, or viewer is the parent's author, or admin).
--  2. Storage objects can no longer be listed by anon/public. Public buckets still serve public URLs.
--     Owners and admins keep SELECT on their files (Storage needs it for remove()).
--  3/4. Storage uploads need a one-off grant that only the server can create (server-only secret,
--     same one as the sign-in throttle), with a per-user daily quota. Direct client uploads are refused.
--  Plus: private.orphan_media() lists stored files no row points at (cleanup script: scripts/cleanup-orphan-media.mjs).

-- ─── 1. Parent visibility ──────────────────────────────────────────────────
create or replace function public.parent_readable(p_game uuid, p_cocktail uuid, p_meme uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when p_game is not null then exists (select 1 from public.games g where g.id = p_game
                                          and (not g.is_hidden or g.author_id = (select auth.uid())))
    when p_cocktail is not null then exists (select 1 from public.cocktails c where c.id = p_cocktail
                                          and (not c.is_hidden or c.author_id = (select auth.uid())))
    when p_meme is not null then exists (select 1 from public.memes m where m.id = p_meme
                                          and (not m.is_hidden or m.author_id = (select auth.uid())))
    else false end;
$$;
revoke execute on function public.parent_readable(uuid, uuid, uuid) from public;
grant execute on function public.parent_readable(uuid, uuid, uuid) to anon, authenticated;

drop policy if exists "comments visible" on public.comments;
create policy "comments visible" on public.comments for select using (
  public.is_admin()
  or ((not is_hidden or author_id = (select auth.uid())) and public.parent_readable(game_id, cocktail_id, meme_id)));

drop policy if exists "variations visible" on public.game_variations;
create policy "variations visible" on public.game_variations for select using (
  public.is_admin()
  or ((not is_hidden or author_id = (select auth.uid())) and public.parent_readable(game_id, null, null)));

drop policy if exists "cocktail variations visible" on public.cocktail_variations;
create policy "cocktail variations visible" on public.cocktail_variations for select using (
  public.is_admin()
  or ((not is_hidden or author_id = (select auth.uid())) and public.parent_readable(null, cocktail_id, null)));

drop policy if exists "ratings readable" on public.ratings;
create policy "ratings readable" on public.ratings for select using (
  public.is_admin() or public.parent_readable(game_id, cocktail_id, null));

-- Reactions: same rule (adds the meme's author; was visible-or-admin).
drop policy if exists "reactions visible" on public.meme_reactions;
create policy "reactions visible" on public.meme_reactions for select using (
  public.is_admin() or public.parent_readable(null, null, meme_id));

-- ─── 2. No public listing of storage ───────────────────────────────────────
drop policy if exists "public read media" on storage.objects;
drop policy if exists "owners read own media" on storage.objects;
drop policy if exists "admins read any media" on storage.objects;
create policy "owners read own media" on storage.objects for select to authenticated
  using (bucket_id in ('avatars', 'game-covers', 'memes', 'cocktails')
         and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "admins read any media" on storage.objects for select to authenticated
  using (bucket_id in ('avatars', 'game-covers', 'memes', 'cocktails') and public.is_admin());

-- ─── 3/4. Server-granted uploads with a daily quota ────────────────────────
create schema if not exists private;
create table if not exists private.upload_grants (
  bucket text not null,
  name text not null,
  user_id uuid not null,
  bytes int not null check (bytes > 0 and bytes <= 4194304),
  created_at timestamptz not null default now(),
  primary key (bucket, name)
);
create index if not exists upload_grants_user_idx on private.upload_grants (user_id, created_at);
revoke all on private.upload_grants from public, anon, authenticated;

-- Called by the server (with the server-only secret) after it has checked and re-encoded the image.
-- Raises 'upload_quota' (P0001) when the user has used today's allowance: 20 files or 40 MB per 24 h.
create or replace function public.grant_upload(p_secret text, p_bucket text, p_name text, p_bytes int)
returns void language plpgsql volatile security definer set search_path = public, private as $$
declare
  v_uid uuid := auth.uid();
  v_count int;
  v_bytes bigint;
begin
  if p_secret is null or p_secret is distinct from (select value from private.app_config where key = 'auth_throttle_secret') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_uid is null or p_bucket not in ('avatars', 'game-covers', 'memes', 'cocktails')
     or p_name is null or p_name not like v_uid::text || '/%' or p_name like '%/%/%'
     or p_bytes is null or p_bytes <= 0 or p_bytes > 4194304 then
    raise exception 'bad upload' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('upload_grant:' || v_uid::text));
  delete from private.upload_grants where created_at < now() - interval '2 days';
  select count(*), coalesce(sum(bytes), 0) into v_count, v_bytes
    from private.upload_grants where user_id = v_uid and created_at > now() - interval '24 hours';
  if v_count >= 20 or v_bytes + p_bytes > 41943040 then
    raise exception 'upload_quota' using errcode = 'P0001';
  end if;
  insert into private.upload_grants (bucket, name, user_id, bytes) values (p_bucket, p_name, v_uid, p_bytes);
end;
$$;
revoke execute on function public.grant_upload(text, text, text, int) from public;
grant execute on function public.grant_upload(text, text, text, int) to authenticated;

-- Used by the storage INSERT policy: a fresh grant must exist for exactly this object and user.
create or replace function public.upload_granted(p_bucket text, p_name text)
returns boolean language sql stable security definer set search_path = public, private as $$
  select exists (select 1 from private.upload_grants g
                 where g.bucket = p_bucket and g.name = p_name and g.user_id = (select auth.uid())
                   and g.created_at > now() - interval '10 minutes');
$$;
revoke execute on function public.upload_granted(text, text) from public;
grant execute on function public.upload_granted(text, text) to authenticated;

drop policy if exists "users upload to own folder" on storage.objects;
create policy "users upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'game-covers', 'memes', 'cocktails')
              and (storage.foldername(name))[1] = (select auth.uid())::text
              and public.upload_granted(bucket_id, name));

-- ─── Orphaned media (service role / SQL editor only) ───────────────────────
-- Files older than p_min_age that no game, cocktail, meme or profile points at.
create or replace function private.orphan_media(p_min_age interval default interval '1 hour')
returns table (bucket_id text, name text, created_at timestamptz)
language sql stable security definer set search_path = public, storage as $$
  select o.bucket_id, o.name, o.created_at
  from storage.objects o
  where o.bucket_id in ('avatars', 'game-covers', 'memes', 'cocktails')
    and o.created_at < now() - p_min_age
    and not exists (
      select 1 from (
        select cover_image_url u from public.games where cover_image_url is not null
        union all select image_url from public.cocktails where image_url is not null
        union all select image_url from public.memes where image_url is not null
        union all select avatar_url from public.profiles where avatar_url is not null
      ) refs
      where refs.u = 'https://eqzrngadyetamexuwrbl.supabase.co/storage/v1/object/public/' || o.bucket_id || '/' || o.name);
$$;
revoke all on function private.orphan_media(interval) from public, anon, authenticated;

-- Wrapper the cleanup script calls through PostgREST with the service key.
create or replace function public.orphan_media(p_min_age interval default interval '1 hour')
returns table (bucket_id text, name text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select * from private.orphan_media(p_min_age);
$$;
revoke all on function public.orphan_media(interval) from public, anon, authenticated;
grant execute on function public.orphan_media(interval) to service_role;
