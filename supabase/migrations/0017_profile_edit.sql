-- Social Sips — profile editing (display name, bio, avatar). Username stays read-only (no UPDATE grant on it).
-- Already in place from earlier migrations: column UPDATE grants (display_name, bio, avatar_url, favourite_drink,
-- party_vibe), length checks (display_name <= 50, bio <= 280) and profiles_avatar_url (avatar must be in the
-- user's own avatars/<id>/ folder). This adds an explicit WITH CHECK and a non-blank display name.
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

alter table public.profiles drop constraint if exists profiles_display_name_blank;
alter table public.profiles add constraint profiles_display_name_blank
  check (display_name is null or btrim(display_name) <> '');
