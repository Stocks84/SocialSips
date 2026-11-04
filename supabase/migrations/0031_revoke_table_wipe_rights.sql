-- 0031: remove table-wipe / schema-level rights from API roles (prepared 2026-11-04, not yet applied).
--
-- authenticated still held TRUNCATE, TRIGGER, REFERENCES and MAINTAIN (PG17) on most public tables
-- (cocktails, cocktail_variations, comments, games, game_variations, memes, profiles, ratings, reports),
-- left over from Supabase's default privileges. None is used by the app, and TRUNCATE is not
-- subject to RLS: anyone able to run it as authenticated could wipe a whole table.
-- anon already lost these in 0029; repeated here so the statement covers both roles.
--
-- Unchanged on purpose: SELECT / INSERT / UPDATE (incl. column-level grants) / DELETE, which RLS
-- governs and the app uses.
--
-- auth_attempts_id_seq: anon and authenticated had USAGE/SELECT/UPDATE. Only auth_throttle_fail()
-- (SECURITY DEFINER, owned by postgres) inserts into auth_attempts, and both roles have no rights on
-- the table itself (revoked in 0006), so the sequence grant is unused.
begin;

revoke truncate, trigger, references, maintain on all tables in schema public from anon, authenticated;

revoke all on sequence public.auth_attempts_id_seq from anon, authenticated;

-- Future tables created by postgres (migrations) no longer get these rights by default either.
alter default privileges for role postgres in schema public
  revoke truncate, trigger, references, maintain on tables from anon, authenticated;

commit;
