-- Social Sips — authors edit their own comments, game variations and cocktail variations.
-- Edits are blocked while the item or its parent post is hidden (same rule as 0016). edited_at is set by a
-- trigger when the text changes (users can't write it: no column grant).
alter table public.comments add column if not exists edited_at timestamptz;
alter table public.game_variations add column if not exists edited_at timestamptz;
alter table public.cocktail_variations add column if not exists edited_at timestamptz;

create or replace function public.mark_edited()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'comments' then
    if new.body is distinct from old.body then new.edited_at := now(); else new.edited_at := old.edited_at; end if;
  else
    if new.title is distinct from old.title or new.rules is distinct from old.rules then new.edited_at := now();
    else new.edited_at := old.edited_at; end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.mark_edited() from public, anon, authenticated;
drop trigger if exists mark_edited on public.comments;
create trigger mark_edited before update on public.comments for each row execute function public.mark_edited();
drop trigger if exists mark_edited on public.game_variations;
create trigger mark_edited before update on public.game_variations for each row execute function public.mark_edited();
drop trigger if exists mark_edited on public.cocktail_variations;
create trigger mark_edited before update on public.cocktail_variations for each row execute function public.mark_edited();

-- Comments: new body grant + own-row policy (admins keep "admin update comments").
grant update (body) on public.comments to authenticated;
drop policy if exists "own comments update" on public.comments;
create policy "own comments update" on public.comments for update
  using (auth.uid() = author_id and not is_hidden)
  with check (auth.uid() = author_id and not is_hidden and public.parent_visible(game_id, cocktail_id, meme_id));

-- Variations: title/rules grants already exist; add the parent check.
drop policy if exists "own variations modify" on public.game_variations;
create policy "own variations modify" on public.game_variations for update
  using (auth.uid() = author_id and not is_hidden)
  with check (auth.uid() = author_id and not is_hidden and public.parent_visible(game_id, null));
drop policy if exists "own cocktail variations update" on public.cocktail_variations;
create policy "own cocktail variations update" on public.cocktail_variations for update
  using (auth.uid() = author_id and not is_hidden)
  with check (auth.uid() = author_id and not is_hidden and public.parent_visible(null, cocktail_id));
