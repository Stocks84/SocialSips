-- 0035: drop indexes that are clearly redundant (performance advisor: unused_index).
--
-- Dropped:
--   public.notifications_unread_idx  (user_id) WHERE read_at IS NULL
--     Fully covered by the unique notifications_batch_idx (user_id, kind, target_id) WHERE read_at IS NULL:
--     same predicate, same leading column. Backs no constraint; the user_id FK is still covered by
--     notifications_user_idx (user_id, updated_at DESC) and by notifications_batch_idx.
--
-- Deliberately kept (flagged "unused" only because the app is pre-launch with little traffic):
--   * every index whose leading columns cover a foreign key (needed for ON DELETE CASCADE / joins),
--     e.g. *_author_idx, comments_*_idx, challenge_*_idx, blocks_blocked_idx, notifications_actor_id_idx;
--   * the 0032 feed paging indexes (*_feed_created_id_idx, *_author_created_id_idx), brand new;
--   * games/cocktails/memes_created_idx: the partial 0032 indexes only apply when a query says
--     NOT is_hidden; list pages and admin views that sort by created_at rely on RLS instead;
--   * games_search_idx (full-text search), games_hangover_idx, memes_top_idx (sort orders in the app);
--   * auth_attempts_*_idx, upload_grants_user_idx (throttle and purge lookups);
--   * reports_*_idx, moderation_notices_target_idx (admin/moderation queries).
begin;
drop index if exists public.notifications_unread_idx;
commit;
