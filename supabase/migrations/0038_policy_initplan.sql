-- 0038: RLS perf — wrap remaining is_admin() and auth.uid() calls in (select ...)
-- so Postgres evaluates them once per statement (initplan) instead of once per row.
-- Expressions are otherwise unchanged (ALTER POLICY keeps roles, command and permissiveness).
-- Functions that take row columns (parent_visible, parent_readable, i_block, meme_visible,
-- upload_granted, storage.foldername, ...) are left as-is.
--
-- 33 policies: 32 wrap is_admin(); storage.objects "users delete own files" wraps the
-- leftover unwrapped auth.uid(). Other auth.uid() / auth.role() / auth.jwt() calls were
-- already wrapped in 0027 / 0029 / later policies.
begin;

alter policy "own entries read" on public.challenge_entries
  using (((user_id = (select auth.uid())) OR (select is_admin())));

alter policy "admin deletes future" on public.challenges
  using (((select is_admin()) AND (starts_on > challenge_week_start())));

alter policy "admin edits future" on public.challenges
  using (((select is_admin()) AND (starts_on > challenge_week_start())))
  with check (((select is_admin()) AND (starts_on > challenge_week_start())));

alter policy "admin schedules future" on public.challenges
  with check (((select is_admin()) AND (starts_on > challenge_week_start())));

alter policy "cocktail variations delete" on public.cocktail_variations
  using (((select is_admin()) OR ((select auth.uid()) = author_id)));

alter policy "cocktail variations update" on public.cocktail_variations
  using (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden))))
  with check (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden) AND parent_visible(NULL::uuid, cocktail_id))));

alter policy "cocktail variations visible" on public.cocktail_variations
  using (((select is_admin()) OR (((NOT is_hidden) OR (author_id = (select auth.uid()))) AND parent_readable(NULL::uuid, cocktail_id, NULL::uuid) AND (NOT i_block(author_id)))));

alter policy "cocktails delete" on public.cocktails
  using (((select is_admin()) OR ((select auth.uid()) = author_id)));

alter policy "cocktails update" on public.cocktails
  using (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden))))
  with check (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden))));

alter policy "cocktails visible" on public.cocktails
  using (((select is_admin()) OR (((NOT is_hidden) OR (author_id = (select auth.uid()))) AND (NOT i_block(author_id)))));

alter policy "comments delete" on public.comments
  using (((select is_admin()) OR ((select auth.uid()) = author_id)));

alter policy "comments update" on public.comments
  using (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden))))
  with check (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden) AND parent_visible(game_id, cocktail_id, meme_id))));

alter policy "comments visible" on public.comments
  using (((select is_admin()) OR (((NOT is_hidden) OR (author_id = (select auth.uid()))) AND parent_readable(game_id, cocktail_id, meme_id) AND (NOT i_block(author_id)))));

alter policy "game variations delete" on public.game_variations
  using (((select is_admin()) OR ((select auth.uid()) = author_id)));

alter policy "game variations update" on public.game_variations
  using (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden))))
  with check (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden) AND parent_visible(game_id, NULL::uuid))));

alter policy "variations visible" on public.game_variations
  using (((select is_admin()) OR (((NOT is_hidden) OR (author_id = (select auth.uid()))) AND parent_readable(game_id, NULL::uuid, NULL::uuid) AND (NOT i_block(author_id)))));

alter policy "games delete" on public.games
  using (((select is_admin()) OR ((select auth.uid()) = author_id)));

alter policy "games update" on public.games
  using (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden))))
  with check (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden))));

alter policy "games visible" on public.games
  using (((select is_admin()) OR (((NOT is_hidden) OR (author_id = (select auth.uid()))) AND (NOT i_block(author_id)))));

alter policy "reactions visible" on public.meme_reactions
  using (((user_id = (select auth.uid())) OR (select is_admin())));

alter policy "memes delete" on public.memes
  using (((select is_admin()) OR ((select auth.uid()) = author_id)));

alter policy "memes update" on public.memes
  using (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden))))
  with check (((select is_admin()) OR (((select auth.uid()) = author_id) AND (NOT is_hidden))));

alter policy "memes visible" on public.memes
  using (((select is_admin()) OR (((NOT is_hidden) OR (author_id = (select auth.uid()))) AND (NOT i_block(author_id)))));

alter policy "notices admin insert" on public.moderation_notices
  with check ((select is_admin()));

alter policy "notices admin update" on public.moderation_notices
  using ((select is_admin()));

alter policy "notices read" on public.moderation_notices
  using (((author_id = (select auth.uid())) OR (select is_admin())));

alter policy "ratings readable" on public.ratings
  using (((select is_admin()) OR parent_readable(game_id, cocktail_id, NULL::uuid)));

alter policy "admin delete reports" on public.reports
  using ((select is_admin()));

alter policy "admin update reports" on public.reports
  using ((select is_admin()));

alter policy "reports read" on public.reports
  using (((select is_admin()) OR ((reporter_id = (select auth.uid())) AND ( SELECT pg_has_role('authenticated'::name, 'MEMBER'::text) AS pg_has_role))));

alter policy "admins delete any media" on storage.objects
  using (((bucket_id = ANY (ARRAY['avatars'::text, 'game-covers'::text, 'memes'::text, 'cocktails'::text])) AND (select is_admin())));

alter policy "admins read any media" on storage.objects
  using (((bucket_id = ANY (ARRAY['avatars'::text, 'game-covers'::text, 'memes'::text, 'cocktails'::text])) AND (select is_admin())));

alter policy "users delete own files" on storage.objects
  using (((bucket_id = ANY (ARRAY['avatars'::text, 'game-covers'::text, 'memes'::text, 'cocktails'::text])) AND ((storage.foldername(name))[1] = ((select auth.uid()))::text)));
commit;
