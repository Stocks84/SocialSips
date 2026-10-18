-- Social Sips — authors can still read their own hidden posts (others + anon still can't; admins see all).
-- Hiding stays admin-only (guard_is_hidden trigger), and can_interact() still blocks comments/ratings on hidden items.
drop policy if exists "games visible" on public.games;
drop policy if exists "comments visible" on public.comments;
drop policy if exists "variations visible" on public.game_variations;
drop policy if exists "cocktail variations visible" on public.cocktail_variations;
drop policy if exists "cocktails visible" on public.cocktails;
drop policy if exists "memes visible" on public.memes;
create policy "games visible" on public.games for select using (not is_hidden or author_id = (select auth.uid()) or public.is_admin());
create policy "comments visible" on public.comments for select using (not is_hidden or author_id = (select auth.uid()) or public.is_admin());
create policy "variations visible" on public.game_variations for select using (not is_hidden or author_id = (select auth.uid()) or public.is_admin());
create policy "cocktail variations visible" on public.cocktail_variations for select using (not is_hidden or author_id = (select auth.uid()) or public.is_admin());
create policy "cocktails visible" on public.cocktails for select using (not is_hidden or author_id = (select auth.uid()) or public.is_admin());
create policy "memes visible" on public.memes for select using (not is_hidden or author_id = (select auth.uid()) or public.is_admin());
