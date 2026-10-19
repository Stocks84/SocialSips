-- Social Sips — sign-up must accept the Terms and Privacy Policy; store when and which version.
alter table public.profiles add column if not exists accepted_terms_at timestamptz;
alter table public.profiles add column if not exists accepted_terms_version text;
alter table public.profiles drop constraint if exists profiles_terms_version_len;
alter table public.profiles add constraint profiles_terms_version_len check (char_length(accepted_terms_version) <= 40);
-- Not readable or writable through the API (no column grants); the owner reads them via the data export.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_terms text := nullif(btrim(new.raw_user_meta_data ->> 'accepted_terms_version'), '');
begin
  if coalesce((new.raw_user_meta_data ->> 'age_confirmed')::boolean, false) is not true then
    raise exception 'Age confirmation required: you must confirm you are 18 or over'
      using errcode = 'check_violation';
  end if;
  if v_terms is null then
    raise exception 'Terms required: you must accept the Terms of Use and Privacy Policy'
      using errcode = 'check_violation';
  end if;

  insert into public.profiles (id, username, date_of_birth, age_confirmed_at, accepted_terms_at, accepted_terms_version)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    (new.raw_user_meta_data ->> 'date_of_birth')::date,
    now(),
    now(),
    left(v_terms, 40)
  );
  return new;
end;
$$;
