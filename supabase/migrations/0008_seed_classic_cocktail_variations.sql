-- Social Sips: seed well-known classic variations for the house cocktails.
-- Uses the existing cocktail_variations table and RLS from 0004/0006 (public read of
-- non-hidden rows, author write, admin hide). Authored by the house account (neon_host).
-- Idempotent: skips any (cocktail, title) pair that already exists. Changes no existing rows.
insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, v.title, v.rules
from (values
  ('Purple Haze Spritz', 'Classic Gin & Tonic',
   E'50ml London dry gin\n150ml tonic water\n1 lime wedge\n\nFill a highball with ice, add gin, top with tonic, stir gently and garnish with the lime.'),
  ('Purple Haze Spritz', 'Spanish Gin Tonic (Gin Tonic de copa)',
   E'50ml gin\n150ml premium tonic\nLemon or lime peel, a few juniper berries\n\nBuild in a large balloon glass packed with ice, pour the tonic down a bar spoon, stir once and garnish with the peel and juniper.'),
  ('Purple Haze Spritz', 'Tom Collins',
   E'50ml gin\n25ml fresh lemon juice\n15ml sugar syrup\nSoda water to top\n\nBuild gin, lemon and syrup over ice in a Collins glass, top with soda, stir and garnish with lemon and a cherry.'),
  ('Cyan Cooler', 'Blue Hawaii',
   E'22ml light rum\n22ml vodka\n15ml blue curaçao\n90ml pineapple juice\n30ml sweet & sour mix\n\nShake with ice, strain over crushed ice in a hurricane glass, garnish with pineapple and a cherry.'),
  ('Cyan Cooler', 'Blue Hawaiian',
   E'30ml light rum\n30ml blue curaçao\n60ml pineapple juice\n30ml cream of coconut\n\nBlend with a cup of ice until smooth (or shake hard), pour into a hurricane glass and garnish with pineapple.'),
  ('Cyan Cooler', 'Blue Lagoon',
   E'25ml vodka\n25ml blue curaçao\nLemonade to top\n\nBuild vodka and curaçao over ice in a highball, top with lemonade, stir and garnish with a lemon slice.'),
  ('Virgin Neon Mule', 'Moscow Mule (with alcohol)',
   E'50ml vodka\n15ml fresh lime juice\n120ml ginger beer\n\nBuild over ice in a copper mug, top with ginger beer, stir and garnish with a lime wedge and mint.'),
  ('Virgin Neon Mule', 'Gin-Gin Mule (with alcohol)',
   E'45ml gin\n22ml fresh lime juice\n30ml sugar syrup\n6 mint leaves\nGinger beer to top\n\nMuddle mint with lime and syrup, add gin, shake with ice, strain over ice in a highball and top with ginger beer. Garnish with mint.'),
  ('Virgin Neon Mule', 'Dark ''n'' Stormy (with alcohol)',
   E'60ml dark rum (traditionally Gosling''s)\n100ml ginger beer\n1 lime wedge\n\nFill a highball with ice and ginger beer, float the rum on top and garnish with the lime.')
) as v(cocktail_name, title, rules)
join public.cocktails c on c.name = v.cocktail_name
where not exists (
  select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = v.title
);
