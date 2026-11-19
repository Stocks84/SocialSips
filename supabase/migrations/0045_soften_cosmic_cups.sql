-- Soften the seeded Cosmic Cups rules so they offer a sip or a soft-drink option
-- instead of telling every player to drink.
--
-- Applied live on 19 Nov 2026 with Will's OK.
--
-- Target rows (from supabase/seed.sql, and any live copy of that seed):
--   public.games
--     slug  = 'cosmic-cups'
--     title = 'Cosmic Cups'
--     author_id = '00000000-0000-0000-0000-000000000001'  -- demo seed author, if present
--
-- Preview first (do not skip this):
--   select id, slug, title, author_id, left(rules, 160) as rules_preview
--   from public.games
--   where slug = 'cosmic-cups';

update public.games
set rules = 'Two teams line up. Each player takes a sip — a soft drink is fine — then flips their cup upside down from the table edge before the next can go. First team done wins the round.'
where slug = 'cosmic-cups'
  and rules is distinct from 'Two teams line up. Each player takes a sip — a soft drink is fine — then flips their cup upside down from the table edge before the next can go. First team done wins the round.';
