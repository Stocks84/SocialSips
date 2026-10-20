-- Re-acceptance of the Terms/Privacy Policy (e.g. after a version bump). Users can't write the
-- accepted_terms_* columns directly; only this function (for themselves) and the sign-up trigger do.
revoke insert on public.profiles from anon, authenticated; -- profiles are created by handle_new_user only

create or replace function public.accept_terms(p_version text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_at timestamptz := now();
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if p_version is null or p_version !~ '^[0-9A-Za-z._-]{1,40}$' then raise exception 'bad_version' using errcode = '22023'; end if;
  update public.profiles set accepted_terms_at = v_at, accepted_terms_version = p_version where id = v_uid;
  if not found then raise exception 'no_profile' using errcode = 'P0002'; end if;
  return v_at;
end; $$;
revoke all on function public.accept_terms(text) from public, anon;
grant execute on function public.accept_terms(text) to authenticated;

-- Cheap read for the middleware: just my accepted version.
create or replace function public.my_terms_version()
returns text language sql stable security definer set search_path = public as $$
  select accepted_terms_version from public.profiles where id = auth.uid();
$$;
revoke all on function public.my_terms_version() from public, anon;
grant execute on function public.my_terms_version() to authenticated;
