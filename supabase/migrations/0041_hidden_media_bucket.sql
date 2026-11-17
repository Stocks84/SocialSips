-- 0041: hidden items' images stop being public while the item is hidden (UK OSA gap G6).
--
-- Problem: game-covers, cocktails and memes are PUBLIC buckets. A public bucket serves every object at
-- /storage/v1/object/public/<bucket>/<path> without checking RLS, so hiding an item (is_hidden = true)
-- left its image reachable by anyone who had the URL.
--
-- Fix: a PRIVATE bucket, 'hidden-media'. Hiding an item MOVES its image there (Storage "move" with
-- destinationBucket, a metadata move, nothing is re-uploaded or re-encoded); unhiding moves it back to the
-- same bucket and path, so the stored URL in the row stays valid and hide stays fully reversible.
-- Object name in hidden-media: '<original bucket>/<user id>/<file>', e.g. 'memes/<uid>/<uuid>.jpg'.
-- Public URLs of a hidden image then return "not found"; nobody can read it through the API except
-- admins and the author's own folder (Storage needs SELECT for remove()).
--
-- The move runs in the app as the admin, so Storage checks these policies (UPDATE with a new bucket_id).
-- Existing policies are ALTERED rather than added to, so no new "multiple permissive policies" appear.
-- No INSERT policy exists for hidden-media: nobody can upload there directly.
-- Delete keeps working for owner + admin in both places (the app removes from both).
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hidden-media', 'hidden-media', false, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = false, file_size_limit = 4194304,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

alter policy "admins read any media" on storage.objects
  using (bucket_id = any (array['avatars', 'game-covers', 'memes', 'cocktails', 'hidden-media'])
         and (select public.is_admin()));

alter policy "owners read own media" on storage.objects
  using ((bucket_id = any (array['avatars', 'game-covers', 'memes', 'cocktails'])
          and (storage.foldername(name))[1] = (select auth.uid())::text)
         or (bucket_id = 'hidden-media' and (storage.foldername(name))[2] = (select auth.uid())::text));

alter policy "admins delete any media" on storage.objects
  using (bucket_id = any (array['avatars', 'game-covers', 'memes', 'cocktails', 'hidden-media'])
         and (select public.is_admin()));

alter policy "users delete own files" on storage.objects
  using ((bucket_id = any (array['avatars', 'game-covers', 'memes', 'cocktails'])
          and (storage.foldername(name))[1] = (select auth.uid())::text)
         or (bucket_id = 'hidden-media' and (storage.foldername(name))[2] = (select auth.uid())::text));

-- Admins only: move an image between its public bucket and hidden-media (hide / unhide).
drop policy if exists "admins move media" on storage.objects;
create policy "admins move media" on storage.objects for update to authenticated
  using (bucket_id = any (array['game-covers', 'memes', 'cocktails', 'hidden-media']) and (select public.is_admin()))
  with check (bucket_id = any (array['game-covers', 'memes', 'cocktails', 'hidden-media']) and (select public.is_admin()));

-- ── Orphan cleanup also covers hidden-media ──────────────────────────────────
-- (scripts/cleanup-orphan-media.mjs) A hidden-media file is referenced when a row's public URL equals
-- the URL of its original '<bucket>/<path>'. Same body as 0015 plus that one extra bucket.
create or replace function private.orphan_media(p_min_age interval default interval '1 hour')
returns table (bucket_id text, name text, created_at timestamptz)
language sql stable security definer set search_path = public, storage as $$
  select o.bucket_id, o.name, o.created_at
  from storage.objects o
  where o.bucket_id in ('avatars', 'game-covers', 'memes', 'cocktails', 'hidden-media')
    and o.created_at < now() - p_min_age
    and not exists (
      select 1 from (
        select cover_image_url u from public.games where cover_image_url is not null
        union all select image_url from public.cocktails where image_url is not null
        union all select image_url from public.memes where image_url is not null
        union all select avatar_url from public.profiles where avatar_url is not null
      ) refs
      where refs.u = 'https://eqzrngadyetamexuwrbl.supabase.co/storage/v1/object/public/'
                     || case when o.bucket_id = 'hidden-media' then o.name else o.bucket_id || '/' || o.name end);
$$;
revoke all on function private.orphan_media(interval) from public, anon, authenticated;

commit;
