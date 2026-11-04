-- 0030: server-owned columns can't be forged on INSERT (prepared 2026-11-04, not yet applied).
--
-- RLS INSERT checks only verify ownership (author_id / reporter_id = auth.uid()), so a signed-in
-- user calling PostgREST directly could insert
--   - a meme with reaction_count = 1000000 (it then tops top_memes / the feed), or
--   - a report that is already status 'dismissed'/'actioned' with an outcome and decided_at
--     (it would never show in the admin queue).
-- These BEFORE INSERT triggers reset those columns, like aa_force_created_at does for created_at.
--
-- Checked first:
--   - The app never sets these on insert: memes/actions.ts inserts title/image only; social.ts
--     report insert and submit_public_report() rely on the column default status = 'open'.
--   - submit_public_report uses INSERT ... ON CONFLICT DO UPDATE SET note = ...: the trigger only
--     touches the proposed new row, so the conflict path (existing report keeps its status) is unchanged.
--   - reaction_count is maintained by count_reactions() (AFTER INSERT/DELETE on meme_reactions) with
--     UPDATEs, and admin moderation (dismiss / hide / delete) uses UPDATE/DELETE: not affected.
--   - A brand-new meme can't have reactions yet (meme_reactions.meme_id references it), so 0 is exact.
--
-- Not changed: EXECUTE on auth_throttle_ok/fail stays granted to anon. The server calls them from the
-- signed-out sign-in and public report paths with the anon-key client (no service_role in the app),
-- and they're already guarded by the shared secret (see 0007 / 0029).
begin;

create or replace function public.force_meme_insert_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.reaction_count := 0;
  return new;
end;
$$;

create or replace function public.force_report_insert_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.status := 'open';
  new.outcome := null;
  new.decided_at := null;
  return new;
end;
$$;

-- Trigger functions: nobody needs to call them directly (Postgres doesn't check EXECUTE when a trigger fires).
revoke execute on function public.force_meme_insert_defaults() from public, anon, authenticated;
revoke execute on function public.force_report_insert_defaults() from public, anon, authenticated;

drop trigger if exists ab_force_insert_defaults on public.memes;
create trigger ab_force_insert_defaults
  before insert on public.memes
  for each row execute function public.force_meme_insert_defaults();

drop trigger if exists ab_force_insert_defaults on public.reports;
create trigger ab_force_insert_defaults
  before insert on public.reports
  for each row execute function public.force_report_insert_defaults();

commit;
