-- Rename the weekly drink dare from 'Cocktail of the week' to 'Drink of the week'
-- (Drinks/Dares naming). Only display text changes; kind stays 'cocktail_variation'.

update public.challenges
set theme = 'Drink of the week',
    description = replace(description, 'any cocktail', 'any drink')
where is_default and theme = 'Cocktail of the week';

create or replace function private.current_challenge()
returns setof public.challenges language plpgsql security definer set search_path = '' as $$
declare v_week date := public.challenge_week_start();
begin
  if not exists (select 1 from public.challenges where starts_on = v_week) then
    insert into public.challenges (starts_on, theme, kind, description, is_default, created_by)
    select v_week,
      case when extract(week from v_week)::int % 2 = 1 then 'Meme of the week' else 'Drink of the week' end,
      case when extract(week from v_week)::int % 2 = 1 then 'meme' else 'cocktail_variation' end,
      case when extract(week from v_week)::int % 2 = 1
        then 'Post your funniest party meme and enter it. The meme with the most votes by Sunday night wins.'
        else 'Add your best twist on any drink as a variation and enter it. The most-voted twist by Sunday night wins.' end,
      true, null
    on conflict (starts_on) do nothing;
  end if;
  if exists (select 1 from public.challenges where winner_notified_at is null and starts_on < v_week and starts_on >= v_week - 56) then
    perform private.notify_challenge_winners();
  end if;
  return query select * from public.challenges where starts_on = v_week;
end;
$$;
