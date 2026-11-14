-- 0033: guests (anon) must not call the following-feed functions.
-- Supabase default privileges re-granted EXECUTE to anon after 0032's revoke from public.
revoke execute on function public.following_feed_games(int, timestamptz, uuid) from anon;
revoke execute on function public.following_meme_ids(int, timestamptz, uuid) from anon;
