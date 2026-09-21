begin;

create or replace function public.get_shochu_keep_navigation_reference(
  p_include_finished boolean default false
)
returns table (
  bottle_id uuid,
  store_id uuid,
  store_name text,
  area text,
  latitude double precision,
  longitude double precision,
  closed_weekdays smallint[],
  is_basic_closed_today boolean,
  brand text,
  remaining_percent smallint,
  kept_at date,
  last_visited_on date,
  days_since_last_visit integer,
  status text
)
language sql
stable
security invoker
set search_path = pg_catalog, pg_temp
as $function$
  with japan_today as (
    select
      (current_timestamp at time zone 'Asia/Tokyo')::date as today,
      extract(dow from (current_timestamp at time zone 'Asia/Tokyo'))::smallint as weekday
  ),
  latest_visits as (
    select
      visit.store_id,
      max(visit.visited_on)::date as last_visited_on
    from public.store_visits as visit
    where visit.user_id = (select auth.uid())
    group by visit.store_id
  )
  select
    bottle.id as bottle_id,
    store.id as store_id,
    store.name as store_name,
    store.area,
    store.latitude,
    store.longitude,
    coalesce(store.closed_weekdays, '{}'::smallint[]) as closed_weekdays,
    japan_today.weekday = any(coalesce(store.closed_weekdays, '{}'::smallint[])) as is_basic_closed_today,
    bottle.brand,
    bottle.current_remaining as remaining_percent,
    bottle.kept_at::date as kept_at,
    visit_reference.last_visited_on,
    case
      when visit_reference.last_visited_on is null then null
      else (japan_today.today - visit_reference.last_visited_on)::integer
    end as days_since_last_visit,
    bottle.status
  from public.bottles as bottle
  inner join public.stores as store
    on store.id = bottle.store_id
   and store.user_id = bottle.user_id
  left join latest_visits
    on latest_visits.store_id = bottle.store_id
  cross join japan_today
  cross join lateral (
    select coalesce(
      latest_visits.last_visited_on,
      bottle.last_visited_at::date,
      bottle.kept_at::date
    ) as last_visited_on
  ) as visit_reference
  where bottle.user_id = (select auth.uid())
    and store.user_id = (select auth.uid())
    and (
      p_include_finished
      or (bottle.status = 'active' and bottle.current_remaining > 0)
    )
  order by
    visit_reference.last_visited_on desc nulls last,
    store.name,
    bottle.brand;
$function$;

comment on function public.get_shochu_keep_navigation_reference(boolean) is
  'Read-only store and bottle reference for Haraken Navi. Returns only the authenticated owner data.';

revoke all on function public.get_shochu_keep_navigation_reference(boolean) from public;
revoke all on function public.get_shochu_keep_navigation_reference(boolean) from anon;
grant execute on function public.get_shochu_keep_navigation_reference(boolean) to authenticated;

commit;
