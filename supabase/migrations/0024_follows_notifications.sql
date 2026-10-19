-- Follows + in-app notifications. Notifications are written only by SECURITY DEFINER triggers/functions,
-- never to yourself, never between blocked users, never for hidden content. Repeat events batch into one
-- unread row (count + latest actor) so the bell stays cheap.

-- ─── Follows ─────────────────────────────────────────────────────────────────
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id, created_at desc);
alter table public.follows enable row level security;
create policy "follows visible" on public.follows for select
  using (not public.i_block(follower_id) and not public.i_block(followee_id));
create policy "follow others" on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()) and not public.i_block(followee_id) and not public.blocked_by(followee_id));
create policy "unfollow" on public.follows for delete to authenticated using (follower_id = (select auth.uid()));
revoke all on public.follows from anon, authenticated;
grant select on public.follows to anon, authenticated;
grant insert (follower_id, followee_id) on public.follows to authenticated;
grant delete on public.follows to authenticated;

create trigger rate_limit_follows before insert on public.follows
  for each row execute function public.enforce_rate_limit('follower_id', '30', '10 minutes', 'follows', '10 minutes');

create or replace function public.limit_follows()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.follows where follower_id = new.follower_id) >= 1000 then
    raise exception 'You can follow up to 1000 people.' using errcode = 'P0001', hint = 'rate_limit';
  end if;
  return new;
end; $$;
revoke execute on function public.limit_follows() from public, anon, authenticated;
create trigger limit_follows before insert on public.follows for each row execute function public.limit_follows();

create or replace function public.follow_counts(p_user uuid)
returns table (followers bigint, following bigint)
language sql stable set search_path = public as $$
  select (select count(*) from public.follows where followee_id = p_user),
         (select count(*) from public.follows where follower_id = p_user);
$$;
grant execute on function public.follow_counts(uuid) to anon, authenticated;

-- Games by people I follow (same shape as feed_games, newest first).
create or replace function public.following_feed_games(max_rows int default 50)
returns table (id uuid, title text, summary text, hangover_rating hangover_rating, min_players integer, tags text[], created_at timestamptz, avg_rating numeric, rating_count bigint)
language sql stable set search_path = public as $$
  select g.id, g.title, g.summary, g.hangover_rating, g.min_players, g.tags, g.created_at,
         round(avg(r.score)::numeric, 2), count(r.id)
  from public.follows f
  join public.games g on g.author_id = f.followee_id
  left join public.ratings r on r.game_id = g.id
  where f.follower_id = (select auth.uid()) and not g.is_hidden
  group by g.id
  order by g.created_at desc
  limit least(max_rows, 100);
$$;
grant execute on function public.following_feed_games(int) to authenticated;

create or replace function public.following_meme_ids(max_rows int default 20)
returns setof uuid language sql stable set search_path = public as $$
  select m.id from public.follows f join public.memes m on m.author_id = f.followee_id
  where f.follower_id = (select auth.uid()) and not m.is_hidden
  order by m.created_at desc limit least(max_rows, 50);
$$;
grant execute on function public.following_meme_ids(int) to authenticated;

-- ─── Notifications ───────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('follow', 'reaction', 'comment', 'variation', 'challenge_votes', 'challenge_win', 'moderation')),
  actor_id uuid references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'game', 'cocktail', 'meme', 'challenge', 'notice')),
  target_id uuid not null,
  preview text check (preview is null or char_length(preview) <= 120),
  count int not null default 1 check (count >= 1),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, updated_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;
create unique index notifications_batch_idx on public.notifications (user_id, kind, target_id) where read_at is null;
alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;

-- Core writer. Skips self, nobody, and blocked pairs (either direction). Batches unread duplicates.
create or replace function private.notify(p_user uuid, p_actor uuid, p_kind text, p_type text, p_target uuid, p_preview text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or p_target is null or p_user = p_actor then return; end if;
  if p_actor is not null and exists (select 1 from public.blocks b
      where (b.blocker_id = p_user and b.blocked_id = p_actor) or (b.blocker_id = p_actor and b.blocked_id = p_user)) then
    return;
  end if;
  insert into public.notifications (user_id, actor_id, kind, target_type, target_id, preview)
  values (p_user, p_actor, p_kind, p_type, p_target, left(p_preview, 120))
  on conflict (user_id, kind, target_id) where read_at is null do update
    set count = public.notifications.count + case when excluded.kind in ('follow', 'challenge_win', 'moderation') then 0 else 1 end,
        actor_id = excluded.actor_id, preview = excluded.preview, updated_at = now();
end; $$;
revoke all on function private.notify(uuid, uuid, text, text, uuid, text) from public, anon, authenticated;

create or replace function private.trg_notify_follow() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform private.notify(new.followee_id, new.follower_id, 'follow', 'profile', new.follower_id, null);
  return null;
end; $$;
create trigger notify_follow after insert on public.follows for each row execute function private.trg_notify_follow();

create or replace function private.trg_notify_reaction() returns trigger language plpgsql security definer set search_path = public as $$
declare m public.memes;
begin
  if tg_op = 'UPDATE' then return null; end if; -- changing your emoji is not a new reaction
  select * into m from public.memes where id = new.meme_id;
  if found and not m.is_hidden then
    perform private.notify(m.author_id, new.user_id, 'reaction', 'meme', m.id, coalesce(m.caption, m.joke_text, 'your meme'));
  end if;
  return null;
end; $$;
create trigger notify_reaction after insert on public.meme_reactions for each row execute function private.trg_notify_reaction();

-- Parent post (game/cocktail/meme) if visible: author, type, id, title.
create or replace function private.visible_parent(p_game uuid, p_cocktail uuid, p_meme uuid,
  out author uuid, out ttype text, out tid uuid, out title text)
language sql stable security definer set search_path = public as $$
  select g.author_id, 'game', g.id, g.title from public.games g where g.id = p_game and not g.is_hidden
  union all select c.author_id, 'cocktail', c.id, c.name from public.cocktails c where c.id = p_cocktail and not c.is_hidden
  union all select m.author_id, 'meme', m.id, coalesce(m.caption, m.joke_text) from public.memes m where m.id = p_meme and not m.is_hidden
  limit 1;
$$;

create or replace function private.trg_notify_comment() returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if new.is_hidden then return null; end if;
  select * into p from private.visible_parent(new.game_id, new.cocktail_id, new.meme_id);
  if p.author is not null then perform private.notify(p.author, new.author_id, 'comment', p.ttype, p.tid, p.title); end if;
  return null;
end; $$;
create trigger notify_comment after insert on public.comments for each row execute function private.trg_notify_comment();

create or replace function private.trg_notify_game_variation() returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if new.is_hidden then return null; end if;
  select * into p from private.visible_parent(new.game_id, null, null);
  if p.author is not null then perform private.notify(p.author, new.author_id, 'variation', p.ttype, p.tid, p.title); end if;
  return null;
end; $$;
create trigger notify_game_variation after insert on public.game_variations for each row execute function private.trg_notify_game_variation();

create or replace function private.trg_notify_cocktail_variation() returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if new.is_hidden then return null; end if;
  select * into p from private.visible_parent(null, new.cocktail_id, null);
  if p.author is not null then perform private.notify(p.author, new.author_id, 'variation', p.ttype, p.tid, p.title); end if;
  return null;
end; $$;
create trigger notify_cocktail_variation after insert on public.cocktail_variations for each row execute function private.trg_notify_cocktail_variation();

-- Votes: batched per challenge, voter not revealed (votes are private).
create or replace function private.trg_notify_vote() returns trigger language plpgsql security definer set search_path = public as $$
declare e public.challenge_entries; c public.challenges;
begin
  if tg_op = 'UPDATE' and new.entry_id = old.entry_id then return null; end if;
  select * into e from public.challenge_entries where id = new.entry_id;
  if not found or not private.entry_visible(e) or e.user_id = new.voter_id then return null; end if;
  if exists (select 1 from public.blocks b where (b.blocker_id = e.user_id and b.blocked_id = new.voter_id) or (b.blocker_id = new.voter_id and b.blocked_id = e.user_id)) then return null; end if;
  select * into c from public.challenges where id = e.challenge_id;
  perform private.notify(e.user_id, null, 'challenge_votes', 'challenge', c.id, c.theme);
  return null;
end; $$;
create trigger notify_vote after insert or update of entry_id on public.challenge_votes for each row execute function private.trg_notify_vote();

create or replace function private.trg_notify_moderation() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform private.notify(new.author_id, null, 'moderation', 'notice', new.id, new.preview);
  return null;
end; $$;
create trigger notify_moderation after insert on public.moderation_notices for each row execute function private.trg_notify_moderation();

-- Blocking removes follows both ways and notifications between the two.
create or replace function private.trg_block_cleanup() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.follows where (follower_id = new.blocker_id and followee_id = new.blocked_id) or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  delete from public.notifications where (user_id = new.blocker_id and actor_id = new.blocked_id) or (user_id = new.blocked_id and actor_id = new.blocker_id);
  return null;
end; $$;
create trigger block_cleanup after insert on public.blocks for each row execute function private.trg_block_cleanup();

-- Winners are notified lazily (no cron): the first current_challenge() call after a week ends.
alter table public.challenges add column winner_notified_at timestamptz;
create or replace function private.notify_challenge_winners()
returns void language plpgsql security definer set search_path = public as $$
declare c public.challenges; w record;
begin
  for c in select * from public.challenges
    where winner_notified_at is null and starts_on < public.challenge_week_start() and starts_on >= public.challenge_week_start() - 56
    for update skip locked
  loop
    select * into w from public.challenge_winner(c.id);
    if w.user_id is not null then perform private.notify(w.user_id, null, 'challenge_win', 'challenge', c.id, c.theme); end if;
    update public.challenges set winner_notified_at = now() where id = c.id;
  end loop;
end; $$;
revoke all on function private.notify_challenge_winners() from public, anon, authenticated;

create or replace function public.current_challenge()
returns setof public.challenges language plpgsql security definer set search_path = public as $$
declare v_week date := public.challenge_week_start();
begin
  if not exists (select 1 from public.challenges where starts_on = v_week) then
    insert into public.challenges (starts_on, theme, kind, description, is_default, created_by)
    select v_week,
      case when extract(week from v_week)::int % 2 = 1 then 'Meme of the week' else 'Cocktail of the week' end,
      case when extract(week from v_week)::int % 2 = 1 then 'meme' else 'cocktail_variation' end,
      case when extract(week from v_week)::int % 2 = 1
        then 'Post your funniest party meme and enter it. The meme with the most votes by Sunday night wins.'
        else 'Add your best twist on any cocktail as a variation and enter it. The most-voted twist by Sunday night wins.' end,
      true, null
    on conflict (starts_on) do nothing;
  end if;
  if exists (select 1 from public.challenges where winner_notified_at is null and starts_on < v_week and starts_on >= v_week - 56) then
    perform private.notify_challenge_winners();
  end if;
  return query select * from public.challenges where starts_on = v_week;
end;
$$;

-- Bell: unread count (capped at 99, uses the partial index) and mark-read.
create or replace function public.unread_notification_count()
returns int language sql stable set search_path = public as $$
  select count(*)::int from (select 1 from public.notifications where user_id = (select auth.uid()) and read_at is null limit 99) s;
$$;
grant execute on function public.unread_notification_count() to authenticated;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void language sql security definer set search_path = public as $$
  update public.notifications set read_at = now()
  where user_id = (select auth.uid()) and read_at is null and (p_ids is null or id = any(p_ids));
$$;
revoke all on function public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;
