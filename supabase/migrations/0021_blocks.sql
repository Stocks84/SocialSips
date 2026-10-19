-- Social Sips — block users. A blocker never sees the blocked user's posts, comments or variations
-- (RLS on every content table + top_memes), and the blocked user can't comment on or add variations
-- to the blocker's posts. Block lists are private. Admins are not affected when moderating.
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);
alter table public.blocks enable row level security;
revoke all on public.blocks from anon, authenticated;
grant select, delete on public.blocks to authenticated;
grant insert (blocker_id, blocked_id) on public.blocks to authenticated;
drop policy if exists "own blocks read" on public.blocks;
create policy "own blocks read" on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
drop policy if exists "own blocks insert" on public.blocks;
create policy "own blocks insert" on public.blocks for insert to authenticated
  with check (blocker_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = blocked_id));
drop policy if exists "own blocks delete" on public.blocks;
create policy "own blocks delete" on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));

-- Max 100 blocks per user (keeps the per-row check cheap).
create or replace function public.limit_blocks()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.blocks where blocker_id = new.blocker_id) >= 100 then
    raise exception 'You can block up to 100 people.' using errcode = 'P0001', hint = 'rate_limit';
  end if;
  return new;
end;
$$;
revoke execute on function public.limit_blocks() from public, anon, authenticated;
drop trigger if exists limit_blocks on public.blocks;
create trigger limit_blocks before insert on public.blocks for each row execute function public.limit_blocks();

-- Does the viewer block p_user?
create or replace function public.i_block(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_user is not null and exists (select 1 from public.blocks b where b.blocker_id = (select auth.uid()) and b.blocked_id = p_user);
$$;
-- Does p_owner block the viewer?
create or replace function public.blocked_by(p_owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_owner is not null and exists (select 1 from public.blocks b where b.blocker_id = p_owner and b.blocked_id = (select auth.uid()));
$$;
create or replace function public.parent_author(p_game uuid, p_cocktail uuid, p_meme uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select case
    when p_game is not null then (select author_id from public.games where id = p_game)
    when p_cocktail is not null then (select author_id from public.cocktails where id = p_cocktail)
    when p_meme is not null then (select author_id from public.memes where id = p_meme)
  end;
$$;
revoke execute on function public.i_block(uuid) from public;
revoke execute on function public.blocked_by(uuid) from public;
revoke execute on function public.parent_author(uuid, uuid, uuid) from public;
grant execute on function public.i_block(uuid) to anon, authenticated;
grant execute on function public.blocked_by(uuid) to anon, authenticated;
grant execute on function public.parent_author(uuid, uuid, uuid) to anon, authenticated;

-- Read policies: same as before, plus "not someone I block" (admins exempt).
drop policy if exists "games visible" on public.games;
create policy "games visible" on public.games for select using (
  public.is_admin() or ((not is_hidden or author_id = (select auth.uid())) and not public.i_block(author_id)));
drop policy if exists "cocktails visible" on public.cocktails;
create policy "cocktails visible" on public.cocktails for select using (
  public.is_admin() or ((not is_hidden or author_id = (select auth.uid())) and not public.i_block(author_id)));
drop policy if exists "memes visible" on public.memes;
create policy "memes visible" on public.memes for select using (
  public.is_admin() or ((not is_hidden or author_id = (select auth.uid())) and not public.i_block(author_id)));
drop policy if exists "comments visible" on public.comments;
create policy "comments visible" on public.comments for select using (
  public.is_admin()
  or ((not is_hidden or author_id = (select auth.uid())) and public.parent_readable(game_id, cocktail_id, meme_id)
      and not public.i_block(author_id)));
drop policy if exists "variations visible" on public.game_variations;
create policy "variations visible" on public.game_variations for select using (
  public.is_admin()
  or ((not is_hidden or author_id = (select auth.uid())) and public.parent_readable(game_id, null, null)
      and not public.i_block(author_id)));
drop policy if exists "cocktail variations visible" on public.cocktail_variations;
create policy "cocktail variations visible" on public.cocktail_variations for select using (
  public.is_admin()
  or ((not is_hidden or author_id = (select auth.uid())) and public.parent_readable(null, cocktail_id, null)
      and not public.i_block(author_id)));

-- Write policies: a blocked user can't comment on / add variations to the blocker's posts.
drop policy if exists "own comments insert" on public.comments;
create policy "own comments insert" on public.comments for insert with check (
  auth.uid() = author_id and public.parent_visible(game_id, cocktail_id, meme_id)
  and not public.blocked_by(public.parent_author(game_id, cocktail_id, meme_id)));
drop policy if exists "own variations insert" on public.game_variations;
create policy "own variations insert" on public.game_variations for insert with check (
  auth.uid() = author_id and public.parent_visible(game_id, null) and not public.blocked_by(public.parent_author(game_id, null, null)));
drop policy if exists "own cocktail variations insert" on public.cocktail_variations;
create policy "own cocktail variations insert" on public.cocktail_variations for insert with check (
  auth.uid() = author_id and public.parent_visible(null, cocktail_id) and not public.blocked_by(public.parent_author(null, cocktail_id, null)));

-- Top memes (SECURITY DEFINER, so add the filter explicitly).
create or replace function public.top_memes(p_since timestamptz default null, p_offset int default 0, p_limit int default 25)
returns table(id uuid, reaction_count bigint)
language sql stable security definer set search_path = public as $$
  select m.id, m.reaction_count::bigint
  from public.memes m
  where not m.is_hidden and (p_since is null or m.created_at >= p_since) and not public.i_block(m.author_id)
  order by m.reaction_count desc, m.created_at desc
  offset greatest(p_offset, 0) limit least(greatest(p_limit, 1), 101);
$$;
