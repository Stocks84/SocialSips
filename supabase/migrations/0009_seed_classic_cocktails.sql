-- Social Sips: seed 14 classic cocktails + 3 classic variations each, posted by the house account (neon_host).

-- Idempotent: cocktails are skipped if a cocktail with the same name exists; variations skipped per (cocktail, title).

-- No images (the app only renders images from its own storage bucket). Changes no existing rows.

begin;

-- Bulk house seed: pause the per-user insert rate limits for this transaction only.
alter table public.cocktails disable trigger rate_limit_cocktails;
alter table public.cocktail_variations disable trigger rate_limit_cocktail_variations;

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Margarita', 'Tequila, lime and orange liqueur, shaken and served with a salt rim.', '[{"item": "Blanco tequila", "amount": "50ml"}, {"item": "Cointreau or triple sec", "amount": "25ml"}, {"item": "Fresh lime juice", "amount": "25ml"}, {"item": "Salt", "amount": "for the rim"}]'::jsonb, 'Salt half the rim of a chilled coupe or rocks glass. Shake everything with ice and strain into the glass (over fresh ice if using a rocks glass). Garnish with a lime wheel.', false
where not exists (select 1 from public.cocktails where name = 'Margarita');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Tommy''s Margarita', '50ml blanco tequila
25ml fresh lime juice
12.5ml agave syrup

Shake with ice and strain over fresh ice in a rocks glass. No orange liqueur; optional salt rim. Created by Julio Bermejo at Tommy''s, San Francisco.' from public.cocktails c
where c.name = 'Margarita' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Tommy''s Margarita');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Spicy Margarita', '50ml blanco tequila
25ml Cointreau
25ml fresh lime juice
10ml agave syrup
2–3 slices fresh jalapeño

Muddle the jalapeño in the shaker, add the rest, shake with ice and double strain over ice in a rocks glass with a salt (or chilli-salt) rim.' from public.cocktails c
where c.name = 'Margarita' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Spicy Margarita');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Frozen Margarita', '50ml blanco tequila
25ml Cointreau
25ml fresh lime juice
10ml sugar syrup
A cup of ice

Blend everything until smooth and pour into a salt-rimmed margarita glass. Garnish with a lime wheel.' from public.cocktails c
where c.name = 'Margarita' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Frozen Margarita');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Old Fashioned', 'Whiskey, sugar and bitters stirred down over a big ice cube.', '[{"item": "Bourbon or rye whiskey", "amount": "60ml"}, {"item": "Sugar syrup (or 1 sugar cube)", "amount": "5–10ml"}, {"item": "Angostura bitters", "amount": "2 dashes"}, {"item": "Orange peel", "amount": "1 piece"}]'::jsonb, 'Stir whiskey, sugar and bitters with ice until well chilled. Strain over a large ice cube in a rocks glass, express the orange peel over the top and drop it in.', false
where not exists (select 1 from public.cocktails where name = 'Old Fashioned');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Oaxaca Old Fashioned', '45ml reposado tequila
15ml mezcal
5ml agave syrup
2 dashes Angostura bitters

Stir with ice, strain over a large cube and flame an orange peel over the top. Created by Phil Ward at Death & Co.' from public.cocktails c
where c.name = 'Old Fashioned' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Oaxaca Old Fashioned');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Rum Old Fashioned', '60ml aged rum
5–10ml demerara syrup
2 dashes Angostura bitters

Stir with ice, strain over a large cube in a rocks glass and garnish with an orange peel.' from public.cocktails c
where c.name = 'Old Fashioned' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Rum Old Fashioned');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Wisconsin Brandy Old Fashioned', '60ml brandy
1 sugar cube
3 dashes Angostura bitters
1 orange slice and 1 cocktail cherry
Lemon-lime soda to top

Muddle sugar, bitters, orange and cherry in a rocks glass. Add ice and brandy, top with soda ("sweet") and stir.' from public.cocktails c
where c.name = 'Old Fashioned' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Wisconsin Brandy Old Fashioned');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Negroni', 'Equal parts gin, Campari and sweet vermouth. Bitter, bold, Italian.', '[{"item": "Gin", "amount": "30ml"}, {"item": "Campari", "amount": "30ml"}, {"item": "Sweet vermouth", "amount": "30ml"}, {"item": "Orange peel", "amount": "1 piece"}]'::jsonb, 'Stir everything with ice and strain over fresh ice (ideally one large cube) in a rocks glass. Garnish with orange peel.', false
where not exists (select 1 from public.cocktails where name = 'Negroni');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Boulevardier', '30ml bourbon or rye
30ml Campari
30ml sweet vermouth

Stir with ice and strain into a chilled coupe (or over a large cube). Garnish with orange peel.' from public.cocktails c
where c.name = 'Negroni' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Boulevardier');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Americano', '30ml Campari
30ml sweet vermouth
Soda water to top

Build over ice in a highball, top with soda, stir and garnish with an orange slice.' from public.cocktails c
where c.name = 'Negroni' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Americano');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Negroni Sbagliato', '30ml Campari
30ml sweet vermouth
Prosecco to top

Build over ice in a rocks or wine glass, top with prosecco and stir gently. Garnish with an orange slice.' from public.cocktails c
where c.name = 'Negroni' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Negroni Sbagliato');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Mojito', 'Cuban highball of white rum, lime, mint, sugar and soda.', '[{"item": "White rum", "amount": "50ml"}, {"item": "Fresh lime juice", "amount": "25ml"}, {"item": "Sugar syrup", "amount": "15ml"}, {"item": "Mint", "amount": "8–10 leaves"}, {"item": "Soda water", "amount": "top"}]'::jsonb, 'Gently press the mint with lime and syrup in a highball. Add rum, fill with crushed ice, stir, top with soda and garnish with a mint sprig.', false
where not exists (select 1 from public.cocktails where name = 'Mojito');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Virgin Mojito (alcohol-free)', '25ml fresh lime juice
15ml sugar syrup
8–10 mint leaves
Soda water to top

Press the mint with lime and syrup, fill with crushed ice, top with soda and stir. Garnish with mint.' from public.cocktails c
where c.name = 'Mojito' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Virgin Mojito (alcohol-free)');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Strawberry Mojito', '50ml white rum
25ml fresh lime juice
15ml sugar syrup
3 strawberries
8–10 mint leaves
Soda water to top

Muddle strawberries with lime and syrup, gently press in the mint, add rum and crushed ice, top with soda and stir.' from public.cocktails c
where c.name = 'Mojito' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Strawberry Mojito');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Ron Collins', '50ml white rum
25ml fresh lemon juice
15ml sugar syrup
Soda water to top

Build over ice in a Collins glass, top with soda and stir. The mint-free cousin of the Mojito.' from public.cocktails c
where c.name = 'Mojito' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Ron Collins');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Daiquiri', 'The classic Cuban sour: rum, lime and sugar, shaken hard.', '[{"item": "White rum", "amount": "60ml"}, {"item": "Fresh lime juice", "amount": "25ml"}, {"item": "Sugar syrup", "amount": "15ml"}]'::jsonb, 'Shake hard with ice and double strain into a chilled coupe. Garnish with a lime wheel.', false
where not exists (select 1 from public.cocktails where name = 'Daiquiri');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Hemingway Daiquiri (Papa Doble)', '60ml white rum
20ml fresh lime juice
15ml fresh grapefruit juice
7.5ml maraschino liqueur

Shake with ice and strain into a chilled coupe.' from public.cocktails c
where c.name = 'Daiquiri' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Hemingway Daiquiri (Papa Doble)');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Frozen Strawberry Daiquiri', '50ml white rum
25ml fresh lime juice
15ml sugar syrup
5 strawberries
A cup of ice

Blend until smooth and pour into a chilled glass. Garnish with a strawberry.' from public.cocktails c
where c.name = 'Daiquiri' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Frozen Strawberry Daiquiri');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Hotel Nacional', '45ml aged rum
30ml pineapple juice
15ml apricot brandy
15ml fresh lime juice
7.5ml sugar syrup

Shake with ice and strain into a chilled coupe.' from public.cocktails c
where c.name = 'Daiquiri' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Hotel Nacional');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Espresso Martini', 'Vodka, coffee liqueur and fresh espresso. Dick Bradsell''s 1980s London classic.', '[{"item": "Vodka", "amount": "50ml"}, {"item": "Coffee liqueur", "amount": "25ml"}, {"item": "Fresh espresso", "amount": "30ml"}, {"item": "Sugar syrup", "amount": "5–10ml (optional)"}]'::jsonb, 'Shake hard with ice and double strain into a chilled coupe for a thick crema. Garnish with three coffee beans.', false
where not exists (select 1 from public.cocktails where name = 'Espresso Martini');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Tequila Espresso Martini', '50ml reposado tequila
25ml coffee liqueur
30ml fresh espresso
5ml agave syrup

Shake hard with ice and double strain into a chilled coupe. Garnish with coffee beans.' from public.cocktails c
where c.name = 'Espresso Martini' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Tequila Espresso Martini');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Salted Caramel Espresso Martini', '50ml vodka
20ml coffee liqueur
15ml salted caramel syrup
30ml fresh espresso

Shake hard with ice and double strain into a chilled coupe.' from public.cocktails c
where c.name = 'Espresso Martini' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Salted Caramel Espresso Martini');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Black Russian', '50ml vodka
25ml coffee liqueur

Build over ice in a rocks glass and stir. Add a float of cream to make it a White Russian.' from public.cocktails c
where c.name = 'Espresso Martini' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Black Russian');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Whiskey Sour', 'Bourbon, lemon and sugar, traditionally silky with egg white.', '[{"item": "Bourbon", "amount": "50ml"}, {"item": "Fresh lemon juice", "amount": "25ml"}, {"item": "Sugar syrup", "amount": "15ml"}, {"item": "Egg white (optional)", "amount": "1 (about 20ml)"}, {"item": "Angostura bitters", "amount": "2 dashes"}]'::jsonb, 'Dry shake without ice, then shake again with ice. Strain over fresh ice in a rocks glass and dot the bitters on the foam.', false
where not exists (select 1 from public.cocktails where name = 'Whiskey Sour');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'New York Sour', '50ml bourbon or rye
25ml fresh lemon juice
15ml sugar syrup
20ml dry red wine

Shake the first three with ice, strain over fresh ice and gently float the red wine on top over a bar spoon.' from public.cocktails c
where c.name = 'Whiskey Sour' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'New York Sour');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Amaretto Sour', '40ml amaretto
20ml bourbon
25ml fresh lemon juice
5ml sugar syrup
1 egg white

Dry shake, shake with ice and strain over fresh ice. Jeffrey Morgenthaler''s version.' from public.cocktails c
where c.name = 'Whiskey Sour' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Amaretto Sour');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Pisco Sour', '60ml pisco
25ml fresh lime juice
20ml sugar syrup
1 egg white
Angostura bitters

Dry shake, shake with ice and strain into a chilled coupe. Finish with three drops of bitters on the foam.' from public.cocktails c
where c.name = 'Whiskey Sour' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Pisco Sour');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Aperol Spritz', 'The Venetian aperitivo: Aperol, prosecco and a splash of soda.', '[{"item": "Prosecco", "amount": "90ml"}, {"item": "Aperol", "amount": "60ml"}, {"item": "Soda water", "amount": "30ml"}, {"item": "Orange slice", "amount": "1"}]'::jsonb, 'Fill a wine glass with ice, add prosecco, then Aperol, then a splash of soda. Stir gently and garnish with an orange slice.', false
where not exists (select 1 from public.cocktails where name = 'Aperol Spritz');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Campari Spritz', '90ml prosecco
60ml Campari
30ml soda water

Build over ice in a wine glass in that order and garnish with an orange slice. More bitter than the Aperol version.' from public.cocktails c
where c.name = 'Aperol Spritz' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Campari Spritz');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Hugo Spritz', '100ml prosecco
20ml elderflower liqueur or cordial
Soda water to top
A few mint leaves, lime wedge

Build over ice in a wine glass, stir gently and garnish with mint and lime.' from public.cocktails c
where c.name = 'Aperol Spritz' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Hugo Spritz');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Venetian Spritz (Select)', '90ml prosecco
60ml Select aperitivo
30ml soda water

Build over ice and garnish with a large green olive, the Venetian way.' from public.cocktails c
where c.name = 'Aperol Spritz' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Venetian Spritz (Select)');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Cosmopolitan', 'Citrus vodka, Cointreau, cranberry and lime, served up.', '[{"item": "Citron vodka", "amount": "40ml"}, {"item": "Cointreau", "amount": "15ml"}, {"item": "Fresh lime juice", "amount": "15ml"}, {"item": "Cranberry juice", "amount": "30ml"}]'::jsonb, 'Shake with ice and strain into a chilled martini glass. Garnish with a flamed orange or lime peel.', false
where not exists (select 1 from public.cocktails where name = 'Cosmopolitan');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Cosmo Royale', '30ml citron vodka
15ml Cointreau
15ml fresh lime juice
20ml cranberry juice
Champagne to top

Shake the first four with ice, strain into a flute and top with champagne.' from public.cocktails c
where c.name = 'Cosmopolitan' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Cosmo Royale');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'White Cosmopolitan', '40ml citron vodka
15ml Cointreau
15ml fresh lime juice
30ml white cranberry juice

Shake with ice and strain into a chilled martini glass.' from public.cocktails c
where c.name = 'Cosmopolitan' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'White Cosmopolitan');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Kamikaze', '30ml vodka
30ml triple sec
30ml fresh lime juice

Shake with ice and strain into a chilled glass (or into shots). The Cosmo''s ancestor.' from public.cocktails c
where c.name = 'Cosmopolitan' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Kamikaze');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Manhattan', 'Rye whiskey, sweet vermouth and bitters, stirred and served up.', '[{"item": "Rye whiskey", "amount": "50ml"}, {"item": "Sweet vermouth", "amount": "25ml"}, {"item": "Angostura bitters", "amount": "2 dashes"}, {"item": "Cocktail cherry", "amount": "1"}]'::jsonb, 'Stir everything with ice until well chilled and strain into a chilled coupe. Garnish with a cherry.', false
where not exists (select 1 from public.cocktails where name = 'Manhattan');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Perfect Manhattan', '50ml rye whiskey
12.5ml sweet vermouth
12.5ml dry vermouth
2 dashes Angostura bitters

Stir with ice, strain into a chilled coupe and garnish with a lemon twist.' from public.cocktails c
where c.name = 'Manhattan' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Perfect Manhattan');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Rob Roy', '50ml blended Scotch
25ml sweet vermouth
2 dashes Angostura bitters

Stir with ice, strain into a chilled coupe and garnish with a cherry.' from public.cocktails c
where c.name = 'Manhattan' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Rob Roy');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Brooklyn', '60ml rye whiskey
20ml dry vermouth
7.5ml maraschino liqueur
7.5ml Amer Picon (or Amaro CioCiaro)

Stir with ice and strain into a chilled coupe.' from public.cocktails c
where c.name = 'Manhattan' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Brooklyn');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Martini', 'Gin and dry vermouth, stirred ice-cold. The king of cocktails.', '[{"item": "Gin", "amount": "60ml"}, {"item": "Dry vermouth", "amount": "15ml"}, {"item": "Lemon twist or olive", "amount": "1"}]'::jsonb, 'Stir with ice until very cold and strain into a chilled martini glass. Garnish with a lemon twist or an olive.', false
where not exists (select 1 from public.cocktails where name = 'Martini');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Dirty Martini', '60ml gin or vodka
10ml dry vermouth
10–15ml olive brine

Stir with ice, strain into a chilled martini glass and garnish with olives.' from public.cocktails c
where c.name = 'Martini' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Dirty Martini');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Vesper', '45ml gin
15ml vodka
7.5ml Lillet Blanc

Shake with ice (as Bond ordered it) and strain into a chilled glass. Garnish with a thin slice of lemon peel.' from public.cocktails c
where c.name = 'Martini' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Vesper');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Gibson', '60ml gin
15ml dry vermouth

Stir with ice, strain into a chilled martini glass and garnish with a cocktail onion.' from public.cocktails c
where c.name = 'Martini' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Gibson');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Paloma', 'Mexico''s favourite highball: tequila, grapefruit soda and lime.', '[{"item": "Blanco tequila", "amount": "50ml"}, {"item": "Fresh lime juice", "amount": "15ml"}, {"item": "Grapefruit soda", "amount": "top"}, {"item": "Salt", "amount": "pinch or rim"}]'::jsonb, 'Build tequila and lime over ice in a salt-rimmed highball, top with grapefruit soda, stir and garnish with a grapefruit wedge.', false
where not exists (select 1 from public.cocktails where name = 'Paloma');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Fresh Paloma', '50ml blanco tequila
50ml fresh pink grapefruit juice
15ml fresh lime juice
10ml agave syrup
Soda water to top

Shake the first four with ice, strain over ice in a salt-rimmed highball and top with soda.' from public.cocktails c
where c.name = 'Paloma' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Fresh Paloma');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Mezcal Paloma', '50ml mezcal
15ml fresh lime juice
Grapefruit soda to top

Build over ice in a highball with a salt or Tajín rim, top with soda and stir.' from public.cocktails c
where c.name = 'Paloma' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Mezcal Paloma');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Cantarito', '50ml blanco tequila
25ml fresh orange juice
15ml fresh lime juice
15ml fresh grapefruit juice
Grapefruit soda to top
Pinch of salt

Build over ice in a clay cantarito (or highball), top with soda and stir.' from public.cocktails c
where c.name = 'Paloma' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Cantarito');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Piña Colada', 'Rum, pineapple and cream of coconut. Puerto Rico''s national drink.', '[{"item": "White rum", "amount": "50ml"}, {"item": "Pineapple juice", "amount": "90ml"}, {"item": "Cream of coconut", "amount": "30ml"}, {"item": "Fresh lime juice", "amount": "10ml (optional)"}]'::jsonb, 'Blend with a cup of ice until smooth (or shake hard and strain over crushed ice). Serve in a hurricane glass with pineapple and a cherry.', false
where not exists (select 1 from public.cocktails where name = 'Piña Colada');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Virgin Piña Colada (alcohol-free)', '120ml pineapple juice
45ml cream of coconut
10ml fresh lime juice
A cup of ice

Blend until smooth and pour into a hurricane glass. Garnish with pineapple.' from public.cocktails c
where c.name = 'Piña Colada' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Virgin Piña Colada (alcohol-free)');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Painkiller', '60ml dark rum (traditionally Pusser''s)
120ml pineapple juice
30ml fresh orange juice
30ml cream of coconut

Shake with ice, pour over crushed ice and grate fresh nutmeg on top.' from public.cocktails c
where c.name = 'Piña Colada' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Painkiller');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Chi Chi', '50ml vodka
90ml pineapple juice
30ml cream of coconut

Blend with ice until smooth, or shake and serve over crushed ice. A Piña Colada made with vodka.' from public.cocktails c
where c.name = 'Piña Colada' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Chi Chi');

insert into public.cocktails (author_id, name, description, ingredients, method, is_alcohol_free)
select '00000000-0000-0000-0000-000000000001'::uuid, 'Mai Tai', 'Trader Vic''s 1944 tiki classic: aged rum, lime, orange curaçao and orgeat.', '[{"item": "Aged Jamaican rum", "amount": "50ml"}, {"item": "Orange curaçao", "amount": "15ml"}, {"item": "Orgeat (almond syrup)", "amount": "15ml"}, {"item": "Fresh lime juice", "amount": "25ml"}, {"item": "Sugar syrup", "amount": "7.5ml"}]'::jsonb, 'Shake with crushed ice and pour everything into a double rocks glass. Garnish with a spent lime shell and a mint sprig.', false
where not exists (select 1 from public.cocktails where name = 'Mai Tai');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Royal Hawaiian Mai Tai', '30ml light rum
30ml dark rum
15ml orange curaçao
15ml orgeat
25ml fresh lime juice
60ml pineapple juice
30ml orange juice

Shake with ice and pour over crushed ice. The fruity 1950s Hawaiian hotel version.' from public.cocktails c
where c.name = 'Mai Tai' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Royal Hawaiian Mai Tai');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Mai Tai with Dark Rum Float', '50ml aged rum
15ml orange curaçao
15ml orgeat
25ml fresh lime juice
15ml dark rum to float

Shake all but the float with crushed ice, pour into a rocks glass and float the dark rum on top. Garnish with mint.' from public.cocktails c
where c.name = 'Mai Tai' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Mai Tai with Dark Rum Float');

insert into public.cocktail_variations (cocktail_id, author_id, title, rules)
select c.id, '00000000-0000-0000-0000-000000000001'::uuid, 'Fog Cutter', '45ml white rum
30ml brandy
15ml gin
15ml orgeat
30ml fresh lemon juice
60ml fresh orange juice
15ml cream sherry to float

Shake all but the sherry with ice, strain over ice in a tall glass and float the sherry. Another Trader Vic classic.' from public.cocktails c
where c.name = 'Mai Tai' and c.author_id = '00000000-0000-0000-0000-000000000001'::uuid
  and not exists (select 1 from public.cocktail_variations x where x.cocktail_id = c.id and x.title = 'Fog Cutter');

alter table public.cocktails enable trigger rate_limit_cocktails;
alter table public.cocktail_variations enable trigger rate_limit_cocktail_variations;

commit;
