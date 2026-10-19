-- Social Sips — low-severity fixes from the 2026-10-19 Claude review.
--  #8  Reactions: the table only shows your own rows (no "what did user X react to"). Counts come from
--      SECURITY DEFINER functions with explicit visibility checks.
--  #9  Authors can't edit a post (or variation) while an admin has it hidden. Admin policies are unchanged.
--  #10 set_reaction(): one atomic upsert/delete, returns the fresh counts (no update-then-insert race).
--  #14 memes.reaction_count kept by trigger; top_memes sorts on it (no full group-by per request).

-- ─── #14 Reaction counter ──────────────────────────────────────────────────
alter table public.memes add column if not exists reaction_count int not null default 0;
update public.memes m set reaction_count = (select count(*) from public.meme_reactions r where r.meme_id = m.id);
create index if not exists memes_top_idx on public.memes (is_hidden, reaction_count desc, created_at desc);

create or replace function public.count_reactions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.memes set reaction_count = reaction_count + 1 where id = new.meme_id;
  elsif tg_op = 'DELETE' then
    update public.memes set reaction_count = greatest(reaction_count - 1, 0) where id = old.meme_id;
  end if;
  return null;
end;
$$;
revoke execute on function public.count_reactions() from public, anon, authenticated;
drop trigger if exists count_reactions on public.meme_reactions;
create trigger count_reactions after insert or delete on public.meme_reactions
  for each row execute function public.count_reactions();

-- ─── #8 Reactions are private per user ─────────────────────────────────────
drop policy if exists "reactions visible" on public.meme_reactions;
create policy "reactions visible" on public.meme_reactions for select using (
  user_id = (select auth.uid()) or public.is_admin());

-- Stats for a page of memes: only memes the viewer may read (visible, own, or admin).
create or replace function public.meme_stats(p_ids uuid[])
returns table(meme_id uuid, reactions jsonb, mine text, comment_count bigint)
language sql stable security definer set search_path = public as $$
  select m.id,
         coalesce((select jsonb_object_agg(e.emoji, e.n) from (
           select r.emoji, count(*) n from public.meme_reactions r where r.meme_id = m.id group by r.emoji) e), '{}'::jsonb),
         (select r.emoji from public.meme_reactions r where r.meme_id = m.id and r.user_id = (select auth.uid())),
         (select count(*) from public.comments c where c.meme_id = m.id and not c.is_hidden)
  from public.memes m
  where m.id = any(p_ids[1:100])
    and (not m.is_hidden or m.author_id = (select auth.uid()) or public.is_admin());
$$;

create or replace function public.top_memes(p_since timestamptz default null, p_offset int default 0, p_limit int default 25)
returns table(id uuid, reaction_count bigint)
language sql stable security definer set search_path = public as $$
  select m.id, m.reaction_count::bigint
  from public.memes m
  where not m.is_hidden and (p_since is null or m.created_at >= p_since)
  order by m.reaction_count desc, m.created_at desc
  offset greatest(p_offset, 0) limit least(greatest(p_limit, 1), 101);
$$;

create or replace function public.profile_reaction_totals(p_user uuid)
returns table(emoji text, n bigint)
language sql stable security definer set search_path = public as $$
  select r.emoji, count(*)
  from public.meme_reactions r
  join public.memes m on m.id = r.meme_id
  where m.author_id = p_user and not m.is_hidden
  group by r.emoji;
$$;
revoke execute on function public.meme_stats(uuid[]) from public;
revoke execute on function public.top_memes(timestamptz, int, int) from public;
revoke execute on function public.profile_reaction_totals(uuid) from public;
grant execute on function public.meme_stats(uuid[]) to anon, authenticated;
grant execute on function public.top_memes(timestamptz, int, int) to anon, authenticated;
grant execute on function public.profile_reaction_totals(uuid) to anon, authenticated;

-- ─── #10 Atomic reaction write ─────────────────────────────────────────────
-- SECURITY INVOKER: table RLS, column grants and the rate-limit trigger all still apply.
create or replace function public.set_reaction(p_meme uuid, p_emoji text)
returns jsonb language plpgsql volatile security invoker set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_counts jsonb;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if p_emoji is null then
    delete from public.meme_reactions where meme_id = p_meme and user_id = v_uid;
  else
    insert into public.meme_reactions (meme_id, user_id, emoji) values (p_meme, v_uid, p_emoji)
    on conflict (meme_id, user_id) do update set emoji = excluded.emoji
      where public.meme_reactions.emoji is distinct from excluded.emoji;
  end if;
  select s.reactions into v_counts from public.meme_stats(array[p_meme]) s;
  return jsonb_build_object('counts', coalesce(v_counts, '{}'::jsonb),
    'mine', (select emoji from public.meme_reactions where meme_id = p_meme and user_id = v_uid));
end;
$$;
revoke execute on function public.set_reaction(uuid, text) from public, anon;
grant execute on function public.set_reaction(uuid, text) to authenticated;

-- ─── #9 No author edits while hidden ───────────────────────────────────────
drop policy if exists "own games update" on public.games;
create policy "own games update" on public.games for update using (auth.uid() = author_id and not is_hidden);
drop policy if exists "own cocktails update" on public.cocktails;
create policy "own cocktails update" on public.cocktails for update using (auth.uid() = author_id and not is_hidden);
drop policy if exists "own memes update" on public.memes;
create policy "own memes update" on public.memes for update using (auth.uid() = author_id and not is_hidden);
drop policy if exists "own variations modify" on public.game_variations;
create policy "own variations modify" on public.game_variations for update using (auth.uid() = author_id and not is_hidden);
drop policy if exists "own cocktail variations update" on public.cocktail_variations;
create policy "own cocktail variations update" on public.cocktail_variations for update using (auth.uid() = author_id and not is_hidden);
