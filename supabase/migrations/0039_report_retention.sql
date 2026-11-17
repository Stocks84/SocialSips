-- 0039: delete reports and moderation decisions 12 months after the case closes.
--
-- Why: the Privacy Policy (src/lib/legal.ts, LEGAL.reportRetention) says reports and moderation
-- decisions are kept "up to 12 months after the case closes". Nothing enforced that until now
-- (UK OSA risk assessment, gap G2).
--
-- What counts as "closed":
--   public.reports            status <> 'open'; closed at decided_at (falls back to created_at for
--                             rows closed before decided_at existed). Open reports are never deleted.
--   public.moderation_notices closed at reversed_at when the item was unhidden, else the day the
--                             statement of reasons was issued (the case closed when the item was hidden).
--
-- How: a SECURITY DEFINER function in schema private (not served by the Data API, nobody but the
-- owner and service_role can run it) plus a daily pg_cron job at 03:17 UTC.
-- pg_cron is available on this project but NOT enabled yet; this migration enables it
-- (create extension). If you'd rather not enable it, skip the last section and run
--   select private.purge_old_reports();
-- by hand once a month.
begin;

create or replace function private.purge_old_reports(p_keep interval default interval '12 months')
returns table (reports_deleted bigint, notices_deleted bigint)
language plpgsql volatile security definer set search_path = '' as $$
declare v_reports bigint; v_notices bigint;
begin
  -- Never allow an interval shorter than the policy promises, even by mistake.
  if p_keep < interval '12 months' then
    raise exception 'retention must be at least 12 months' using errcode = '22023';
  end if;
  with d as (
    delete from public.reports r
    where r.status <> 'open'
      and coalesce(r.decided_at, r.created_at) < now() - p_keep
    returning 1)
  select count(*) into v_reports from d;
  with d as (
    delete from public.moderation_notices n
    where coalesce(n.reversed_at, n.created_at) < now() - p_keep
    returning 1)
  select count(*) into v_notices from d;
  return query select v_reports, v_notices;
end;
$$;
revoke all on function private.purge_old_reports(interval) from public, anon, authenticated;
grant execute on function private.purge_old_reports(interval) to service_role;

-- ── Schedule (pg_cron) ───────────────────────────────────────────────────────
-- Supabase's documented way to enable it from SQL: schema pg_catalog (creates the "cron" schema).
create extension if not exists pg_cron with schema pg_catalog;

-- Idempotent: replace the job if this migration is ever re-run.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge-old-reports') then
    perform cron.unschedule('purge-old-reports');
  end if;
  perform cron.schedule('purge-old-reports', '17 3 * * *', 'select private.purge_old_reports()');
end $$;

commit;
