-- Social Sips — security hardening (review 2026-10-17)
--  1. profiles: private columns (date_of_birth, age_confirmed_at, is_admin) no longer readable by other users
--  2. created_at always set by the DB; rate limits race-safe
--  3. owner-updatable columns restricted (column grants); ratings keys immutable
--  4. no comments / ratings / variations on hidden items
--  5. DB length limits + image URLs pinned to this project's storage, own folder
--  6. storage buckets: 4 MB, jpeg/png/webp/gif only
--  7. sign-in throttle table + RPCs
--  8. indexes for FK lookups, rate-limit counts, feeds; rating_summary() RPC

-- ─── 1. Profiles PII ────────────────────────────────────────────────────────
revoke select on public.profiles from anon, authenticated;
grant select (id, username, display_name, bio, avatar_url, favourite_drink, party_vibe, created_at)
  on public.profiles to anon, authenticated;

-- Full own row (incl. DOB / admin flag) for the signed-in user only.
create or replace function public.my_profile()
returns setof public.profiles language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid();
$$;
revoke execute on function public.my_profile() from public, anon;
grant execute on function public.my_profile() to authenticated;
-- is_admin() (0004) is already SECURITY DEFINER, so it still reads profiles.is_admin.

-- ─── 2a. created_at / updated_at set by the DB ─────────────────────────────
create or replace function public.force_created_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.created_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['games', 'game_variations', 'cocktails', 'cocktail_variations', 'memes',
                           'comments', 'ratings', 'reports'] loop
    -- "aa_" so it fires before the rate-limit trigger (BEFORE triggers run alphabetically)
    execute format('drop trigger if exists aa_force_created_at on public.%I', t);
    execute format('create trigger aa_force_created_at before insert on public.%I
                    for each row execute function public.force_created_at()', t);
  end loop;
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then new.updated_at := now();
  else new.updated_at := now(); new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
drop trigger if exists ab_touch_updated_at on public.games;
create trigger ab_touch_updated_at before insert or update on public.games
  for each row execute function public.touch_updated_at();

-- ─── 2b. Race-safe rate limits (serialise per user + table) ────────────────
create or replace function public.enforce_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner_col text := tg_argv[0];
  max_rows int := tg_argv[1]::int;
  win interval := tg_argv[2]::interval;
  noun text := tg_argv[3];
  owner_id uuid;
  recent int;
begin
  execute format('select ($1).%I', owner_col) into owner_id using new;
  if owner_id is null or public.is_admin() then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext(tg_table_name), hashtext(owner_id::text));
  execute format('select count(*) from %I.%I where %I = $1 and created_at > now() - $2',
                 tg_table_schema, tg_table_name, owner_col)
    into recent using owner_id, win;
  if recent >= max_rows then
    raise exception 'Slow down! 🍹 You can post up to % % every %. Try again a bit later.',
      max_rows, noun, tg_argv[4]
      using errcode = 'P0001', hint = 'rate_limit';
  end if;
  return new;
end;
$$;

-- ─── 3. Column-level update grants ─────────────────────────────────────────
-- (RLS still decides WHICH rows; these decide WHICH columns. is_hidden stays
--  grantable for the admin policies and is guarded by guard_is_hidden.)
revoke update on public.games, public.game_variations, public.cocktails, public.cocktail_variations,
  public.memes, public.comments, public.ratings, public.reports from anon, authenticated;
grant update (title, summary, rules, equipment, min_players, max_players, hangover_rating, tags,
              cover_image_url, updated_at, is_hidden) on public.games to authenticated;
grant update (title, rules, is_hidden) on public.game_variations to authenticated;
grant update (title, rules, is_hidden) on public.cocktail_variations to authenticated;
grant update (name, description, ingredients, method, is_alcohol_free, image_url, is_hidden)
  on public.cocktails to authenticated;
grant update (caption, joke_text, image_url, is_hidden) on public.memes to authenticated;
grant update (is_hidden) on public.comments to authenticated;
grant update (status) on public.reports to authenticated;
-- PostgREST upsert sets every posted column, so the key columns need the grant;
-- this trigger makes them immutable instead.
grant update (user_id, game_id, cocktail_id, score) on public.ratings to authenticated;
create or replace function public.ratings_keys_immutable()
returns trigger language plpgsql set search_path = public as $$
begin
  new.user_id := old.user_id; new.game_id := old.game_id; new.cocktail_id := old.cocktail_id;
  new.created_at := old.created_at;
  return new;
end;
$$;
drop trigger if exists ratings_keys_immutable on public.ratings;
create trigger ratings_keys_immutable before update on public.ratings
  for each row execute function public.ratings_keys_immutable();

-- ─── 4. No new comments / ratings / variations on hidden items ─────────────
create or replace function public.parent_visible(p_game uuid, p_cocktail uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when p_game is not null then exists (select 1 from public.games where id = p_game and not is_hidden)
    when p_cocktail is not null then exists (select 1 from public.cocktails where id = p_cocktail and not is_hidden)
    else false end;
$$;
grant execute on function public.parent_visible(uuid, uuid) to anon, authenticated;

drop policy if exists "own comments insert" on public.comments;
create policy "own comments insert" on public.comments for insert
  with check (auth.uid() = author_id and public.parent_visible(game_id, cocktail_id));
drop policy if exists "own ratings insert" on public.ratings;
create policy "own ratings insert" on public.ratings for insert
  with check (auth.uid() = user_id and public.parent_visible(game_id, cocktail_id));
drop policy if exists "own ratings update" on public.ratings;
create policy "own ratings update" on public.ratings for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and public.parent_visible(game_id, cocktail_id));
drop policy if exists "own variations insert" on public.game_variations;
create policy "own variations insert" on public.game_variations for insert
  with check (auth.uid() = author_id and public.parent_visible(game_id, null));
drop policy if exists "own cocktail variations insert" on public.cocktail_variations;
create policy "own cocktail variations insert" on public.cocktail_variations for insert
  with check (auth.uid() = author_id and public.parent_visible(null, cocktail_id));

-- ─── 5. Length limits + image URL pinning ──────────────────────────────────
alter table public.games
  add constraint games_summary_len check (char_length(summary) between 1 and 200),
  add constraint games_rules_len check (char_length(rules) between 1 and 5000),
  add constraint games_equipment_len check (cardinality(equipment) <= 10 and char_length(array_to_string(equipment, ',')) <= 600),
  add constraint games_tags_len check (cardinality(tags) <= 10 and char_length(array_to_string(tags, ',')) <= 400),
  add constraint games_slug_len check (char_length(slug) <= 80),
  add constraint games_cover_url check (cover_image_url is null or starts_with(cover_image_url,
    'https://eqzrngadyetamexuwrbl.supabase.co/storage/v1/object/public/game-covers/' || author_id::text || '/'));
alter table public.game_variations
  add constraint game_variations_title_len check (char_length(title) between 1 and 80),
  add constraint game_variations_rules_len check (char_length(rules) between 1 and 3000);
alter table public.cocktail_variations
  add constraint cocktail_variations_title_len check (char_length(title) between 1 and 80),
  add constraint cocktail_variations_rules_len check (char_length(rules) between 1 and 3000);
alter table public.cocktails
  add constraint cocktails_name_len check (char_length(name) between 1 and 80),
  add constraint cocktails_description_len check (char_length(description) between 1 and 300),
  add constraint cocktails_method_len check (char_length(method) between 1 and 3000),
  add constraint cocktails_ingredients_len check (jsonb_typeof(ingredients) = 'array'
    and jsonb_array_length(ingredients) <= 20 and char_length(ingredients::text) <= 4000),
  add constraint cocktails_image_url check (image_url is null or starts_with(image_url,
    'https://eqzrngadyetamexuwrbl.supabase.co/storage/v1/object/public/cocktails/' || author_id::text || '/'));
alter table public.memes
  add constraint memes_caption_len check (char_length(caption) <= 200),
  add constraint memes_joke_len check (char_length(joke_text) <= 500),
  add constraint memes_image_url check (image_url is null or starts_with(image_url,
    'https://eqzrngadyetamexuwrbl.supabase.co/storage/v1/object/public/memes/' || author_id::text || '/'));
alter table public.profiles
  add constraint profiles_display_name_len check (char_length(display_name) <= 50),
  add constraint profiles_favourite_drink_len check (char_length(favourite_drink) <= 60),
  add constraint profiles_party_vibe_len check (char_length(party_vibe) <= 60),
  add constraint profiles_avatar_url check (avatar_url is null or starts_with(avatar_url,
    'https://eqzrngadyetamexuwrbl.supabase.co/storage/v1/object/public/avatars/' || id::text || '/'));

-- ─── 6. Storage buckets ────────────────────────────────────────────────────
update storage.buckets
  set file_size_limit = 4194304,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  where id in ('avatars', 'game-covers', 'memes', 'cocktails');
drop policy if exists "users delete own files" on storage.objects;
create policy "users delete own files" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'game-covers', 'memes', 'cocktails')
         and (storage.foldername(name))[1] = auth.uid()::text);

-- ─── 7. Sign-in throttle (failures per hashed key; no direct table access) ─
create table if not exists public.auth_attempts (
  id bigserial primary key,
  key_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists auth_attempts_key_idx on public.auth_attempts (key_hash, created_at);
alter table public.auth_attempts enable row level security;
revoke all on public.auth_attempts from anon, authenticated;

-- True if every key is under its limit. Keys look like 'ip:1.2.3.4' / 'email:a@b.c'.
create or replace function public.auth_throttle_ok(p_keys text[])
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select not exists (
    select 1 from unnest(p_keys) k
    where (select count(*) from public.auth_attempts a
           where a.key_hash = encode(extensions.digest(k, 'sha256'), 'hex')
             and a.created_at > now() - interval '15 minutes')
          >= case when k like 'ip:%' then 30 else 10 end
  );
$$;
create or replace function public.auth_throttle_fail(p_keys text[])
returns void language sql volatile security definer set search_path = public, extensions as $$
  delete from public.auth_attempts where created_at < now() - interval '1 day';
  insert into public.auth_attempts (key_hash)
    select encode(extensions.digest(k, 'sha256'), 'hex') from unnest(p_keys[1:3]) k;
$$;
revoke execute on function public.auth_throttle_ok(text[]) from public;
revoke execute on function public.auth_throttle_fail(text[]) from public;
grant execute on function public.auth_throttle_ok(text[]) to anon, authenticated;
grant execute on function public.auth_throttle_fail(text[]) to anon, authenticated;

-- ─── 8. Indexes + rating summary ───────────────────────────────────────────
create index if not exists comments_game_idx on public.comments (game_id, created_at) where game_id is not null;
create index if not exists comments_cocktail_idx on public.comments (cocktail_id, created_at) where cocktail_id is not null;
create index if not exists comments_author_idx on public.comments (author_id, created_at);
create index if not exists game_variations_game_idx on public.game_variations (game_id, created_at);
create index if not exists game_variations_author_idx on public.game_variations (author_id, created_at);
create index if not exists cocktail_variations_cocktail_idx on public.cocktail_variations (cocktail_id, created_at);
create index if not exists cocktail_variations_author_idx on public.cocktail_variations (author_id, created_at);
create index if not exists ratings_game_idx on public.ratings (game_id) where game_id is not null;
create index if not exists ratings_cocktail_idx on public.ratings (cocktail_id) where cocktail_id is not null;
create index if not exists games_author_idx on public.games (author_id, created_at);
create index if not exists games_created_idx on public.games (created_at desc);
create index if not exists cocktails_author_idx on public.cocktails (author_id, created_at);
create index if not exists cocktails_created_idx on public.cocktails (created_at desc);
create index if not exists memes_author_idx on public.memes (author_id, created_at);
create index if not exists memes_created_idx on public.memes (created_at desc);
create index if not exists reports_reporter_idx on public.reports (reporter_id, created_at);
create index if not exists reports_target_idx on public.reports (target_type, target_id);

create or replace function public.rating_summary(p_game uuid default null, p_cocktail uuid default null)
returns table (avg_score numeric, rating_count bigint)
language sql stable security invoker set search_path = public as $$
  select round(avg(score)::numeric, 2), count(*)
  from public.ratings
  where (p_game is not null and game_id = p_game) or (p_cocktail is not null and cocktail_id = p_cocktail);
$$;
grant execute on function public.rating_summary(uuid, uuid) to anon, authenticated;
