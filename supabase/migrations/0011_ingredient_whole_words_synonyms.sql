-- Social Sips: ingredient filter matches whole words (gin != ginger) + small synonym list
-- (whiskey -> bourbon/rye/scotch/whisky, rum -> rhum/cachaça). Case-insensitive.
-- Safe to re-run: recreates feed_cocktails with the same signature and grants. No data is changed.
begin;

drop function if exists public.feed_cocktails(text, boolean, text, integer, text);

create function public.feed_cocktails(
  q text default null, alcohol_free boolean default false, sort text default 'newest',
  max_rows integer default 60, ing text default null
)
returns table(id uuid, name text, description text, is_alcohol_free boolean, image_url text,
              created_at timestamptz, avg_rating numeric, rating_count bigint)
language sql stable set search_path to 'public'
as $$
  with
  -- Small synonym list: searching the key also matches each synonym (whole words, any case).
  -- Add a row here to extend it. Rum styles (white/dark/aged/spiced rum) already match "rum" as a word.
  synonyms(term, syn) as (values
    ('whiskey', 'whisky'), ('whiskey', 'bourbon'), ('whiskey', 'rye'), ('whiskey', 'scotch'),
    ('whisky', 'whiskey'), ('whisky', 'bourbon'), ('whisky', 'rye'), ('whisky', 'scotch'),
    ('rum', 'rhum'), ('rum', 'cachaça')
  ),
  raw as (
    select lower(btrim(ing)) as w where ing is not null and btrim(ing) <> ''
    union select s.syn from synonyms s where s.term = lower(btrim(ing))
  ),
  -- escape regex metacharacters so typed text is matched literally
  terms as (select regexp_replace(w, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g') as rx from raw)
  select c.id, c.name, c.description, c.is_alcohol_free, c.image_url, c.created_at,
         round(avg(r.score)::numeric, 2), count(r.id)
  from cocktails c
  left join ratings r on r.cocktail_id = c.id
  where not c.is_hidden
    and (not alcohol_free or c.is_alcohol_free)
    and (q is null or q = ''
         or (c.name || ' ' || c.description) ilike '%' || q || '%'
         or exists (select 1 from jsonb_array_elements(c.ingredients) e
                    where coalesce(e->>'item', '') || ' ' || coalesce(e->>'amount', '') ilike '%' || q || '%'))
    and (ing is null or btrim(ing) = ''
         or exists (select 1 from jsonb_array_elements(c.ingredients) e, terms t
                    where coalesce(e->>'item', '') ~* ('\m' || t.rx || '\M')))
  group by c.id
  order by
    case when sort = 'top' then coalesce(avg(r.score), 0) end desc nulls last,
    case when sort = 'top' then count(r.id) end desc,
    c.created_at desc
  limit least(max_rows, 100);
$$;

grant execute on function public.feed_cocktails(text, boolean, text, integer, text) to anon, authenticated, service_role;

commit;
