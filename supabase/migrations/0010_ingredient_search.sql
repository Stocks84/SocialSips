-- Social Sips: ingredient search/filter.
-- Ingredients are already structured: cocktails.ingredients jsonb = [{ "item": text, "amount": text }]
-- (validated in the app, edited via ingredient rows in the cocktail form). RLS on cocktails already
-- gives public read (non-hidden), author write, admin update/delete, so no new table or policy is needed.
-- This migration:
--   * adds an `ing` filter that matches ingredient names only (case-insensitive, partial words);
--   * makes free-text `q` match ingredient names/amounts instead of the raw JSON (which matched key names).
-- Safe to re-run: drops/recreates the function and re-grants the same privileges. No data is changed.
begin;

drop function if exists public.feed_cocktails(text, boolean, text, integer);
drop function if exists public.feed_cocktails(text, boolean, text, integer, text);

create function public.feed_cocktails(
  q text default null, alcohol_free boolean default false, sort text default 'newest',
  max_rows integer default 60, ing text default null
)
returns table(id uuid, name text, description text, is_alcohol_free boolean, image_url text,
              created_at timestamptz, avg_rating numeric, rating_count bigint)
language sql stable set search_path to 'public'
as $$
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
    and (ing is null or ing = ''
         or exists (select 1 from jsonb_array_elements(c.ingredients) e
                    where coalesce(e->>'item', '') ilike '%' || ing || '%'))
  group by c.id
  order by
    case when sort = 'top' then coalesce(avg(r.score), 0) end desc nulls last,
    case when sort = 'top' then count(r.id) end desc,
    c.created_at desc
  limit least(max_rows, 100);
$$;

grant execute on function public.feed_cocktails(text, boolean, text, integer, text) to anon, authenticated, service_role;

commit;
