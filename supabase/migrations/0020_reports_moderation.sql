-- Social Sips — DSA notice-and-action + statement of reasons.
--  * Signed-out visitors can report (server-only RPC with the server secret; the app rate-limits by IP).
--  * New reasons: illegal content, copyright. Reports can point at any link ('link' target).
--  * Reporters can read their own reports (status + outcome).
--  * moderation_notices: why an item was hidden, readable by its author (and admins).

-- ─── Reports ────────────────────────────────────────────────────────────────
alter table public.reports alter column reporter_id drop not null;
alter table public.reports alter column target_id drop not null;
alter table public.reports add column if not exists reporter_email text;
alter table public.reports add column if not exists target_url text;
alter table public.reports add column if not exists outcome text;
alter table public.reports add column if not exists decided_at timestamptz;

alter table public.reports drop constraint if exists reports_reason_check;
alter table public.reports add constraint reports_reason_check check (reason = any (array[
  'illegal', 'copyright', 'underage', 'spam', 'harassment', 'dangerous', 'hate', 'other']));
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type = any (array[
  'game', 'comment', 'variation', 'cocktail', 'cocktail_variation', 'meme', 'link']));
alter table public.reports drop constraint if exists reports_target_shape;
alter table public.reports add constraint reports_target_shape check (
  (target_type = 'link') = (target_id is null) and (target_type <> 'link' or target_url is not null));
alter table public.reports drop constraint if exists reports_email_len;
alter table public.reports add constraint reports_email_len check (char_length(reporter_email) <= 254);
alter table public.reports drop constraint if exists reports_url_len;
alter table public.reports add constraint reports_url_len check (char_length(target_url) <= 500);
alter table public.reports drop constraint if exists reports_outcome_check;
alter table public.reports add constraint reports_outcome_check check (outcome is null or outcome in ('action_taken', 'no_action'));

-- Signed-in reports keep going through the table (reporter_id = auth.uid()); anon can't insert directly.
revoke insert on public.reports from anon;
revoke select on public.reports from anon;
grant update (outcome, decided_at) on public.reports to authenticated; -- admins only, via "admin update reports"

drop policy if exists "own reports read" on public.reports;
create policy "own reports read" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));

-- Public (signed-out or signed-in) report from the /report form. Server-only: needs the server secret.
create or replace function public.submit_public_report(
  p_secret text, p_target_type text, p_target_id uuid, p_target_url text, p_reason text, p_note text, p_email text)
returns uuid language plpgsql volatile security definer set search_path = public, private as $$
declare v_id uuid;
begin
  if p_secret is null or p_secret is distinct from (select value from private.app_config where key = 'auth_throttle_secret') then
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
revoke execute on function public.submit_public_report(text, text, uuid, text, text, text, text) from public;
grant execute on function public.submit_public_report(text, text, uuid, text, text, text, text) to anon, authenticated;

-- ─── Statement of reasons ──────────────────────────────────────────────────
create table if not exists public.moderation_notices (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('game', 'comment', 'variation', 'cocktail', 'cocktail_variation', 'meme')),
  target_id uuid not null,
  author_id uuid references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('illegal', 'copyright', 'underage', 'spam', 'harassment', 'dangerous', 'hate', 'other')),
  explanation text check (char_length(explanation) <= 1000),
  preview text check (char_length(preview) <= 200),
  created_at timestamptz not null default now(),
  reversed_at timestamptz
);
create index if not exists moderation_notices_author_idx on public.moderation_notices (author_id, created_at desc);
create index if not exists moderation_notices_target_idx on public.moderation_notices (target_type, target_id);
alter table public.moderation_notices enable row level security;
revoke all on public.moderation_notices from anon, authenticated;
grant select on public.moderation_notices to authenticated;
grant insert (target_type, target_id, author_id, reason, explanation, preview) on public.moderation_notices to authenticated;
grant update (reversed_at) on public.moderation_notices to authenticated;
drop policy if exists "notices read" on public.moderation_notices;
create policy "notices read" on public.moderation_notices for select to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());
drop policy if exists "notices admin insert" on public.moderation_notices;
create policy "notices admin insert" on public.moderation_notices for insert to authenticated with check (public.is_admin());
drop policy if exists "notices admin update" on public.moderation_notices;
create policy "notices admin update" on public.moderation_notices for update to authenticated using (public.is_admin());
