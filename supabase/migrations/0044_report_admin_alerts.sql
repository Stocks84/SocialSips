-- In-app alerts for admins when a new report is filed.
-- One notification per report per admin. Reporter is not stored on the row
-- (actor_id is null) so a later demotion cannot leak reporter identity.
-- Does not email anyone; Resend is wired in the app behind an env flag that
-- is off by default.
-- Written only in this branch; do not apply until Will says so.

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in (
    'follow', 'reaction', 'comment', 'variation',
    'challenge_votes', 'challenge_win', 'moderation', 'report'
  ));

alter table public.notifications drop constraint if exists notifications_target_type_check;
alter table public.notifications add constraint notifications_target_type_check
  check (target_type in (
    'profile', 'game', 'cocktail', 'meme', 'challenge', 'notice', 'report'
  ));

create or replace function private.report_preview(p_type text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_type
    when 'cocktail' then 'a drink'
    when 'cocktail_variation' then 'a drink variation'
    when 'game' then 'a game'
    when 'variation' then 'a game variation'
    when 'meme' then 'a meme'
    when 'comment' then 'a comment'
    when 'link' then 'a link'
    else 'a post'
  end;
$$;

create or replace function private.trg_notify_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin record;
begin
  -- All current admins (suspended members cannot be admins: profiles_admin_not_suspended).
  -- Do not use private.notify: that helper skips blocked pairs, and an admin must still see the report.
  for admin in
    select p.id from public.profiles p
    where p.is_admin
  loop
    insert into public.notifications (user_id, actor_id, kind, target_type, target_id, preview)
    values (admin.id, null, 'report', 'report', new.id, private.report_preview(new.target_type))
    on conflict (user_id, kind, target_id) where read_at is null do nothing;
  end loop;
  return null;
end;
$$;

drop trigger if exists notify_report on public.reports;
create trigger notify_report
  after insert on public.reports
  for each row execute function private.trg_notify_report();

revoke all on function private.report_preview(text) from public, anon, authenticated;
revoke all on function private.trg_notify_report() from public, anon, authenticated;
