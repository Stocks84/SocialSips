-- 0027: RLS perf — wrap auth.uid() in (select ...) so it is evaluated once per statement, not per row.
-- Expressions are otherwise unchanged (ALTER POLICY keeps roles/command/permissiveness).
-- Also merges the overlapping permissive admin/owner UPDATE and DELETE policies on cocktail_variations
-- (effective access identical: permissive policies are OR'ed; the admin policy had no WITH CHECK so its USING applied).
begin;
alter policy "own cocktail variations insert" on public.cocktail_variations
  with check ((((select auth.uid()) = author_id) AND parent_visible(NULL::uuid, cocktail_id) AND (NOT blocked_by(parent_author(NULL::uuid, cocktail_id, NULL::uuid)))));
alter policy "own cocktails delete" on public.cocktails
  using (((select auth.uid()) = author_id));
alter policy "own cocktails insert" on public.cocktails
  with check (((select auth.uid()) = author_id));
alter policy "own cocktails update" on public.cocktails
  using ((((select auth.uid()) = author_id) AND (NOT is_hidden)));
alter policy "own comments delete" on public.comments
  using (((select auth.uid()) = author_id));
alter policy "own comments insert" on public.comments
  with check ((((select auth.uid()) = author_id) AND parent_visible(game_id, cocktail_id, meme_id) AND (NOT blocked_by(parent_author(game_id, cocktail_id, meme_id)))));
alter policy "own comments update" on public.comments
  using ((((select auth.uid()) = author_id) AND (NOT is_hidden)))
  with check ((((select auth.uid()) = author_id) AND (NOT is_hidden) AND parent_visible(game_id, cocktail_id, meme_id)));
alter policy "own variations delete" on public.game_variations
  using (((select auth.uid()) = author_id));
alter policy "own variations insert" on public.game_variations
  with check ((((select auth.uid()) = author_id) AND parent_visible(game_id, NULL::uuid) AND (NOT blocked_by(parent_author(game_id, NULL::uuid, NULL::uuid)))));
alter policy "own variations modify" on public.game_variations
  using ((((select auth.uid()) = author_id) AND (NOT is_hidden)))
  with check ((((select auth.uid()) = author_id) AND (NOT is_hidden) AND parent_visible(game_id, NULL::uuid)));
alter policy "own games delete" on public.games
  using (((select auth.uid()) = author_id));
alter policy "own games insert" on public.games
  with check (((select auth.uid()) = author_id));
alter policy "own games update" on public.games
  using ((((select auth.uid()) = author_id) AND (NOT is_hidden)));
alter policy "own reactions delete" on public.meme_reactions
  using (((select auth.uid()) = user_id));
alter policy "own reactions insert" on public.meme_reactions
  with check ((((select auth.uid()) = user_id) AND meme_visible(meme_id)));
alter policy "own reactions update" on public.meme_reactions
  using (((select auth.uid()) = user_id))
  with check ((((select auth.uid()) = user_id) AND meme_visible(meme_id)));
alter policy "own memes delete" on public.memes
  using (((select auth.uid()) = author_id));
alter policy "own memes insert" on public.memes
  with check (((select auth.uid()) = author_id));
alter policy "own memes update" on public.memes
  using ((((select auth.uid()) = author_id) AND (NOT is_hidden)));
alter policy "own profile update" on public.profiles
  using (((select auth.uid()) = id))
  with check (((select auth.uid()) = id));
alter policy "own ratings delete" on public.ratings
  using (((select auth.uid()) = user_id));
alter policy "own ratings insert" on public.ratings
  with check ((((select auth.uid()) = user_id) AND parent_visible(game_id, cocktail_id)));
alter policy "own ratings update" on public.ratings
  using (((select auth.uid()) = user_id))
  with check ((((select auth.uid()) = user_id) AND parent_visible(game_id, cocktail_id)));
alter policy "own reports insert" on public.reports
  with check ((reporter_id = (select auth.uid())));
drop policy "admin delete cocktail_variations" on public.cocktail_variations;
drop policy "own cocktail variations delete" on public.cocktail_variations;
create policy "cocktail variations delete" on public.cocktail_variations for delete to public
  using (is_admin() OR ((select auth.uid()) = author_id));
drop policy "admin update cocktail_variations" on public.cocktail_variations;
drop policy "own cocktail variations update" on public.cocktail_variations;
create policy "cocktail variations update" on public.cocktail_variations for update to public
  using (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden)))
  with check (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden) AND parent_visible(NULL::uuid, cocktail_id)));
commit;
