-- Social Sips — V1 age verification: DOB (18+ CHECK, from 0001) + required
-- "I confirm I am 18 or over" liability checkbox recorded as age_confirmed_at.

alter table public.profiles add column age_confirmed_at timestamptz;
update public.profiles set age_confirmed_at = created_at where age_confirmed_at is null;
alter table public.profiles alter column age_confirmed_at set not null;

-- Signup trigger: reject signup unless user metadata has age_confirmed = true.
-- Client sends options.data = { username, date_of_birth, age_confirmed: true }.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce((new.raw_user_meta_data ->> 'age_confirmed')::boolean, false) is not true then
    raise exception 'Age confirmation required: you must confirm you are 18 or over'
      using errcode = 'check_violation';
  end if;

  insert into public.profiles (id, username, date_of_birth, age_confirmed_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    (new.raw_user_meta_data ->> 'date_of_birth')::date,
    now()
  );
  return new;
end;
$$;
