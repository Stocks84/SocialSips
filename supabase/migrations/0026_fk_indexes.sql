-- 0026: cover foreign keys flagged by the Supabase performance advisor
create index if not exists challenge_entries_cocktail_variation_id_idx on public.challenge_entries (cocktail_variation_id);
create index if not exists challenge_entries_meme_id_idx on public.challenge_entries (meme_id);
create index if not exists challenge_votes_voter_id_idx on public.challenge_votes (voter_id);
create index if not exists challenges_created_by_idx on public.challenges (created_by);
create index if not exists notifications_actor_id_idx on public.notifications (actor_id);
