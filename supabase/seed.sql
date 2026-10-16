-- Social Sips — local dev seed (fictional content). Runs with `supabase db reset`.
-- Creates one demo user so games have an author.

insert into auth.users (id, email, raw_user_meta_data, instance_id, aud, role, encrypted_password, email_confirmed_at, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000001', 'demo@socialsips.local',
  '{"username":"neon_host","date_of_birth":"1998-05-20","age_confirmed":true}',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  crypt('password123', gen_salt('bf')), now(), now(), now()
);

insert into public.games (author_id, title, slug, summary, rules, equipment, min_players, hangover_rating, tags) values
  ('00000000-0000-0000-0000-000000000001', 'Neon Never Have I Ever', 'neon-never',
   'The classic, with glow sticks for points.',
   'Everyone holds five glow sticks. Take turns saying "Never have I ever…". Anyone who has done it drops a glow stick and takes a sip. Last glowing player wins.',
   '{glow sticks}', 3, 'mild_hangover', '{classic,party}'),
  ('00000000-0000-0000-0000-000000000001', 'Cosmic Cups', 'cosmic-cups',
   'Flip-cup relay where the losing team names the next planet.',
   'Two teams line up. Each player drinks, then flips their cup upside down from the table edge before the next can go. First team done wins the round.',
   '{plastic cups,table}', 6, 'two_day_hangover', '{team,fast}'),
  ('00000000-0000-0000-0000-000000000001', 'Mocktail Mafia', 'mocktail-mafia',
   'Social deduction, played with mocktails.',
   'Secretly deal roles. Each night the Mafia picks a target; each day the town votes. Eliminated players mix the next round of mocktails.',
   '{playing cards}', 5, 'no_hangover', '{strategy,alcohol-free}');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free) values
  ('00000000-0000-0000-0000-000000000001', 'Purple Haze Spritz', 'Butterfly-pea gin, tonic and lemon. Watch it change colour.',
   '[{"item":"Butterfly-pea gin","amount":"40ml"},{"item":"Tonic","amount":"120ml"},{"item":"Lemon","amount":"1 wedge"}]',
   'Build over ice. Squeeze lemon last for the colour change.', false),
  ('00000000-0000-0000-0000-000000000001', 'Cyan Cooler', 'Blue curaçao, pineapple and soda over crushed ice.',
   '[{"item":"Blue curaçao","amount":"25ml"},{"item":"Pineapple juice","amount":"75ml"},{"item":"Soda","amount":"top"}]',
   'Shake curaçao and pineapple, strain over crushed ice, top with soda.', false),
  ('00000000-0000-0000-0000-000000000001', 'Virgin Neon Mule', 'Ginger beer, lime and mint. Zero hangover.',
   '[{"item":"Ginger beer","amount":"150ml"},{"item":"Lime","amount":"half"},{"item":"Mint","amount":"5 leaves"}]',
   'Muddle mint and lime, add ice, top with ginger beer.', true);
