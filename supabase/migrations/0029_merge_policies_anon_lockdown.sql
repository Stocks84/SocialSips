-- 0029: two quick safety wins (prepared 2026-11-03, not yet applied).
--
-- A) Merge the remaining overlapping permissive RLS policies (advisor: multiple_permissive_policies)
--    on cocktails, comments, game_variations, games, memes (UPDATE + DELETE) and reports (SELECT).
--    Effective access is identical: permissive policies are OR'ed, and a policy without WITH CHECK
--    uses its USING expression as the check, so the merged WITH CHECK is "admin USING OR own CHECK".
--    Same pattern as cocktail_variations in 0027.
--
-- B) Tighten guest (anon) permissions.
--    - anon keeps SELECT on public content. It loses INSERT/DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN
--      on public tables: every app write goes through a signed-in session, and RLS already
--      denied these (auth.uid() is null). TRUNCATE in particular is not subject to RLS.
--    - EXECUTE revoked from anon (and PUBLIC) on SECURITY DEFINER RPCs that only work signed in
--      (they raise 'not signed in' / need auth.uid()) and on helpers only used in INSERT/UPDATE checks.
--    - Trigger functions: EXECUTE revoked from PUBLIC/anon/authenticated (as 0016/0024 did for
--      count_reactions/limit_follows). Postgres does not check EXECUTE when a trigger fires.
--    Kept for anon on purpose: is_admin, i_block, parent_readable (used by anon SELECT policies),
--    auth_throttle_ok/fail (sign-in, secret-guarded), submit_public_report (public report form),
--    current_challenge, challenge_board, challenge_winner, user_challenge_wins, meme_stats,
--    top_memes, profile_reaction_totals, and all SECURITY INVOKER read RPCs (feed_*, rating_summary, ...).
begin;

-- ─── A) merged policies ─────────────────────────────────────────────────────
drop policy "admin delete cocktails" on public.cocktails;
drop policy "own cocktails delete" on public.cocktails;
create policy "cocktails delete" on public.cocktails for delete to public
  using (is_admin() OR ((select auth.uid()) = author_id));
drop policy "admin update cocktails" on public.cocktails;
drop policy "own cocktails update" on public.cocktails;
create policy "cocktails update" on public.cocktails for update to public
  using (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden)))
  with check (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden)));

drop policy "admin delete comments" on public.comments;
drop policy "own comments delete" on public.comments;
create policy "comments delete" on public.comments for delete to public
  using (is_admin() OR ((select auth.uid()) = author_id));
drop policy "admin update comments" on public.comments;
drop policy "own comments update" on public.comments;
create policy "comments update" on public.comments for update to public
  using (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden)))
  with check (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden) AND parent_visible(game_id, cocktail_id, meme_id)));

drop policy "admin delete game_variations" on public.game_variations;
drop policy "own variations delete" on public.game_variations;
create policy "game variations delete" on public.game_variations for delete to public
  using (is_admin() OR ((select auth.uid()) = author_id));
drop policy "admin update game_variations" on public.game_variations;
drop policy "own variations modify" on public.game_variations;
create policy "game variations update" on public.game_variations for update to public
  using (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden)))
  with check (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden) AND parent_visible(game_id, NULL::uuid)));

drop policy "admin delete games" on public.games;
drop policy "own games delete" on public.games;
create policy "games delete" on public.games for delete to public
  using (is_admin() OR ((select auth.uid()) = author_id));
drop policy "admin update games" on public.games;
drop policy "own games update" on public.games;
create policy "games update" on public.games for update to public
  using (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden)))
  with check (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden)));

drop policy "admin delete memes" on public.memes;
drop policy "own memes delete" on public.memes;
create policy "memes delete" on public.memes for delete to public
  using (is_admin() OR ((select auth.uid()) = author_id));
drop policy "admin update memes" on public.memes;
drop policy "own memes update" on public.memes;
create policy "memes update" on public.memes for update to public
  using (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden)))
  with check (is_admin() OR (((select auth.uid()) = author_id) AND (NOT is_hidden)));

-- reports: "admin read reports" was TO public, "own reports read" TO authenticated only.
-- The pg_has_role() term keeps the own-reports branch limited to members of authenticated, exactly as before.
drop policy "admin read reports" on public.reports;
drop policy "own reports read" on public.reports;
create policy "reports read" on public.reports for select to public
  using (is_admin() OR ((reporter_id = (select auth.uid())) AND (select pg_has_role('authenticated', 'MEMBER'))));

-- ─── B) anon table privileges ───────────────────────────────────────────────
revoke insert, delete, truncate, references, trigger, maintain
  on public.cocktail_variations, public.cocktails, public.comments, public.game_variations,
     public.games, public.memes, public.ratings
  from anon;
revoke delete, truncate, references, trigger, maintain on public.profiles, public.reports from anon;

-- ─── B) signed-in-only RPCs and write-check helpers: no guest EXECUTE ──────
revoke execute on function public.enter_challenge(uuid, uuid) from public, anon;
revoke execute on function public.withdraw_challenge_entry(uuid) from public, anon;
revoke execute on function public.set_challenge_vote(uuid, uuid) from public, anon;
revoke execute on function public.grant_upload(text, text, text, integer) from public, anon;
revoke execute on function public.upload_granted(text, text) from public, anon;
revoke execute on function public.blocked_by(uuid) from public, anon;
revoke execute on function public.parent_author(uuid, uuid, uuid) from public, anon;
revoke execute on function public.parent_visible(uuid, uuid) from public, anon;
revoke execute on function public.parent_visible(uuid, uuid, uuid) from public, anon;
revoke execute on function public.meme_visible(uuid) from public, anon;
grant execute on function
  public.enter_challenge(uuid, uuid), public.withdraw_challenge_entry(uuid), public.set_challenge_vote(uuid, uuid),
  public.grant_upload(text, text, text, integer), public.upload_granted(text, text), public.blocked_by(uuid),
  public.parent_author(uuid, uuid, uuid), public.parent_visible(uuid, uuid), public.parent_visible(uuid, uuid, uuid),
  public.meme_visible(uuid)
  to authenticated, service_role;

-- ─── B) trigger functions: never callable as RPCs ──────────────────────────
revoke execute on function public.enforce_rate_limit() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.limit_reactions() from public, anon, authenticated;
revoke execute on function public.force_created_at() from public, anon, authenticated;
revoke execute on function public.guard_is_hidden() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.ratings_keys_immutable() from public, anon, authenticated;

commit;
