-- Social Sips — reaction rate limit + profile reaction totals.
-- Triggers and a function only: no new tables or foreign keys (so PostgREST embeds are unaffected).

-- Max 30 reaction writes (new or changed) per user per minute. Reactions are one row per meme, so the shared
-- row-counting limiter can't see changes; a tiny per-user counter does. Not exposed to the API (RLS on, no policies).
create table if not exists public.reaction_rate (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  n int not null default 0
);
alter table public.reaction_rate enable row level security;
revoke all on public.reaction_rate from anon, authenticated;

create or replace function public.limit_reactions()
returns trigger language plpgsql security definer set search_path = public as $$
declare cur int;
begin
  if public.is_admin() then return new; end if;
  insert into public.reaction_rate as rr (user_id, window_start, n) values (new.user_id, now(), 1)
  on conflict (user_id) do update
    set n = case when rr.window_start < now() - interval '1 minute' then 1 else rr.n + 1 end,
        window_start = case when rr.window_start < now() - interval '1 minute' then now() else rr.window_start end
  returning n into cur;
  if cur > 30 then
    raise exception 'Slow down! 🍹 You can react up to 30 times a minute. Try again in a moment.'
      using errcode = 'P0001', hint = 'rate_limit';
  end if;
  return new;
end;
$$;
drop trigger if exists rate_limit_reactions on public.meme_reactions;
create trigger rate_limit_reactions before insert or update of emoji on public.meme_reactions
  for each row execute function public.limit_reactions();

-- Reactions received on a user's visible memes, by emoji (RLS on meme_reactions already hides hidden memes).
create or replace function public.profile_reaction_totals(p_user uuid)
returns table(emoji text, n bigint)
language sql stable security invoker set search_path = public as $$
  select r.emoji, count(*)
  from public.meme_reactions r
  join public.memes m on m.id = r.meme_id
  where m.author_id = p_user and not m.is_hidden
  group by r.emoji;
$$;
grant execute on function public.profile_reaction_totals(uuid) to anon, authenticated;
