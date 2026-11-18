-- Remember that a member dismissed the first-visit welcome prompt.
-- Set welcome_dismissed_at when they dismiss it or follow a link in it, so the
-- hide persists across devices. The app uses localStorage until this file is
-- applied; do not apply it as part of this branch without Will's OK.

alter table public.profiles
  add column if not exists welcome_dismissed_at timestamptz;

-- Column-level grants (profiles has no table-level SELECT/UPDATE for members).
-- Other members can see the timestamp because the select policy is public;
-- it is only a dismiss flag. Anon gets nothing.
revoke select (welcome_dismissed_at), update (welcome_dismissed_at)
  on public.profiles from anon, authenticated;
grant select (welcome_dismissed_at) on public.profiles to authenticated;
grant update (welcome_dismissed_at) on public.profiles to authenticated;
