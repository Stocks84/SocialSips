-- Social Sips — self-serve account deletion. The app first removes the user's Storage files with their own
-- session (Storage owner policies), then calls this. Deletes everything the user authored, then the auth user
-- (cascades: profile, games, memes, comments, variations, ratings, reactions, reports, blocks, notices).
-- Admin accounts are refused (remove admin rights first), so the moderator account can't be deleted by accident.
create or replace function public.delete_my_account()
returns void language plpgsql volatile security definer set search_path = public, private, auth as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if exists (select 1 from public.profiles where id = v_uid and is_admin) then
    raise exception 'admin_account' using errcode = 'P0001';
  end if;
  delete from public.cocktails where author_id = v_uid; -- FK is ON DELETE SET NULL, but the user's own posts go too
  delete from private.upload_grants where user_id = v_uid;
  delete from auth.users where id = v_uid;
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
