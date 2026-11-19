-- Remember that a member dismissed the first-visit welcome prompt.
-- Additive and safe to re-run: nullable timestamptz, no default (Postgres
-- will not rewrite the table), IF NOT EXISTS, and grants only on this column.
-- Existing RLS policy "own profile update" already limits UPDATE to
-- (select auth.uid()) = id, so a member cannot write another row. Column
-- grants already block updates to is_admin, username, suspended_at, and
-- the other profile fields not listed in 0028; this file only adds
-- welcome_dismissed_at. Anon gets no grant. Other signed-in members can
-- see the timestamp (the select policy is public); it is only a dismiss
-- flag, not private content.
-- Apply at push time. The app treats a missing column as "not dismissed"
-- so a short deploy window is safe.

alter table public.profiles
  add column if not exists welcome_dismissed_at timestamptz;

revoke select (welcome_dismissed_at), update (welcome_dismissed_at)
  on public.profiles from anon, authenticated;
grant select (welcome_dismissed_at) on public.profiles to authenticated;
grant update (welcome_dismissed_at) on public.profiles to authenticated;

notify pgrst, 'reload schema';
