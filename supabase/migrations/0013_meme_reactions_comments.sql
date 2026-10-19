-- Social Sips — meme reactions, comments on memes, meme stats + top sort.
-- Additive only: new table, new nullable column, a widened check, new functions.

-- ─── Comments can belong to a meme ─────────────────────────────────────────
alter table public.comments add column if not exists meme_id uuid references public.memes(id) on delete cascade;
create index if not exists comments_meme_idx on public.comments(meme_id) where meme_id is not null;
alter table public.comments drop constraint if exists comments_check;
alter table public.comments drop constraint if exists comments_one_parent;
alter table public.comments add constraint comments_one_parent check (num_nonnulls(game_id, cocktail_id, meme_id) = 1);

-- Parent must exist and not be hidden (3-arg version adds memes; the 2-arg one stays for ratings).
create or replace function public.parent_visible(p_game uuid, p_cocktail uuid, p_meme uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when p_game is not null then exists (select 1 from public.games where id = p_game and not is_hidden)
    when p_cocktail is not null then exists (select 1 from public.cocktails where id = p_cocktail and not is_hidden)
    when p_meme is not null then exists (select 1 from public.memes where id = p_meme and not is_hidden)
    else false end;
$$;
drop policy if exists "own comments insert" on public.comments;
create policy "own comments insert" on public.comments for insert
  with check (auth.uid() = author_id and public.parent_visible(game_id, cocktail_id, meme_id));

-- ─── Reactions: one per user per meme ──────────────────────────────────────
create table if not exists public.meme_reactions (
  meme_id uuid not null references public.memes(id) on delete cascade,
  -- auth.users (not profiles): a (meme_id, user_id) PK pointing at profiles makes PostgREST see a memes<->profiles
  -- many-to-many and breaks the memes -> profiles author embed.
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('😂', '🔥', '🍸', '💀', '👏')),
  created_at timestamptz not null default now(),
  primary key (meme_id, user_id)
);
create index if not exists meme_reactions_user_idx on public.meme_reactions(user_id);
alter table public.meme_reactions enable row level security;

create or replace function public.meme_visible(p_meme uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memes where id = p_meme and not is_hidden);
$$;

drop policy if exists "reactions visible" on public.meme_reactions;
drop policy if exists "own reactions insert" on public.meme_reactions;
drop policy if exists "own reactions update" on public.meme_reactions;
drop policy if exists "own reactions delete" on public.meme_reactions;
create policy "reactions visible" on public.meme_reactions for select using (public.meme_visible(meme_id) or public.is_admin());
create policy "own reactions insert" on public.meme_reactions for insert with check (auth.uid() = user_id and public.meme_visible(meme_id));
create policy "own reactions update" on public.meme_reactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id and public.meme_visible(meme_id));
create policy "own reactions delete" on public.meme_reactions for delete using (auth.uid() = user_id);

revoke all on public.meme_reactions from anon, authenticated;
grant select on public.meme_reactions to anon, authenticated;
grant insert (meme_id, user_id, emoji) on public.meme_reactions to authenticated;
grant update (emoji) on public.meme_reactions to authenticated;
grant delete on public.meme_reactions to authenticated;

-- ─── Stats for a page of memes (RLS applies: security invoker) ─────────────
create or replace function public.meme_stats(p_ids uuid[])
returns table(meme_id uuid, reactions jsonb, mine text, comment_count bigint)
language sql stable security invoker set search_path = public as $$
  select m.id,
         coalesce((select jsonb_object_agg(e.emoji, e.n) from (
           select r.emoji, count(*) n from public.meme_reactions r where r.meme_id = m.id group by r.emoji) e), '{}'::jsonb),
         (select r.emoji from public.meme_reactions r where r.meme_id = m.id and r.user_id = auth.uid()),
         (select count(*) from public.comments c where c.meme_id = m.id and not c.is_hidden)
  from public.memes m
  where m.id = any(p_ids[1:100]);
$$;

-- ─── Top memes (most reactions), optional time window, paged ───────────────
create or replace function public.top_memes(p_since timestamptz default null, p_offset int default 0, p_limit int default 25)
returns table(id uuid, reaction_count bigint)
language sql stable security invoker set search_path = public as $$
  select m.id, count(r.user_id) as reaction_count
  from public.memes m
  left join public.meme_reactions r on r.meme_id = m.id
  where not m.is_hidden and (p_since is null or m.created_at >= p_since)
  group by m.id
  order by count(r.user_id) desc, m.created_at desc
  offset greatest(p_offset, 0) limit least(greatest(p_limit, 1), 101);
$$;
grant execute on function public.meme_stats(uuid[]) to anon, authenticated;
grant execute on function public.top_memes(timestamptz, int, int) to anon, authenticated;
