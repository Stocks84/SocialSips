-- Social Sips — follow-ups from the Claude re-review of 0006
--  * sign-in throttle RPCs require a server-only secret (stops anonymous lock-out / table growth)
--  * auth_attempts(created_at) index for the clean-up
--  * equipment/tags joined-length limits match the app (10 × 60 / 10 × 40 + commas)
-- The secret itself is NOT in this file: set it once with
--   insert into private.app_config (key, value) values ('auth_throttle_secret', '<random>');
-- and put the same value in the AUTH_THROTTLE_SECRET env var (Vercel + .env.local).

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.app_config (key text primary key, value text not null);
revoke all on private.app_config from public, anon, authenticated;

create index if not exists auth_attempts_created_idx on public.auth_attempts (created_at);

drop function if exists public.auth_throttle_ok(text[]);
drop function if exists public.auth_throttle_fail(text[]);

create or replace function public.auth_throttle_ok(p_secret text, p_keys text[])
returns boolean language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if p_secret is null or p_secret is distinct from (select value from private.app_config where key = 'auth_throttle_secret') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return not exists (
    select 1 from unnest(p_keys[1:3]) k
    where (select count(*) from public.auth_attempts a
           where a.key_hash = encode(extensions.digest(k, 'sha256'), 'hex')
             and a.created_at > now() - interval '15 minutes')
          >= case when k like 'ip:%' then 30 else 10 end
  );
end;
$$;

create or replace function public.auth_throttle_fail(p_secret text, p_keys text[])
returns void language plpgsql volatile security definer set search_path = public, extensions as $$
begin
  if p_secret is null or p_secret is distinct from (select value from private.app_config where key = 'auth_throttle_secret') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.auth_attempts where created_at < now() - interval '1 day';
  insert into public.auth_attempts (key_hash)
    select encode(extensions.digest(k, 'sha256'), 'hex') from unnest(p_keys[1:3]) k;
end;
$$;
revoke execute on function public.auth_throttle_ok(text, text[]) from public;
revoke execute on function public.auth_throttle_fail(text, text[]) from public;
grant execute on function public.auth_throttle_ok(text, text[]) to anon, authenticated;
grant execute on function public.auth_throttle_fail(text, text[]) to anon, authenticated;

alter table public.games drop constraint games_equipment_len, drop constraint games_tags_len;
alter table public.games
  add constraint games_equipment_len check (cardinality(equipment) <= 10 and char_length(array_to_string(equipment, ',')) <= 610),
  add constraint games_tags_len check (cardinality(tags) <= 10 and char_length(array_to_string(tags, ',')) <= 410);
