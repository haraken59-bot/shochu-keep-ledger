begin;

create or replace function public.get_shochu_keep_reference(
  p_include_finished boolean default false
)
returns table (
  bottle_id uuid,
  store_id uuid,
  store_name text,
  brand text,
  remaining_percent smallint,
  last_visited_on date,
  status text
)
language sql
stable
security invoker
set search_path = pg_catalog, pg_temp
as $function$
  with latest_visits as (
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
    bottle.brand,
    bottle.current_remaining as remaining_percent,
    coalesce(
      latest_visits.last_visited_on,
      bottle.last_visited_at::date,
      bottle.kept_at::date
    ) as last_visited_on,
    bottle.status
  from public.bottles as bottle
  inner join public.stores as store
    on store.id = bottle.store_id
   and store.user_id = bottle.user_id
  left join latest_visits
    on latest_visits.store_id = bottle.store_id
  where bottle.user_id = (select auth.uid())
    and store.user_id = (select auth.uid())
    and (
      p_include_finished
      or (bottle.status = 'active' and bottle.current_remaining > 0)
    )
  order by
    coalesce(
      latest_visits.last_visited_on,
      bottle.last_visited_at::date,
      bottle.kept_at::date
    ) desc nulls last,
    store.name,
    bottle.brand;
$function$;

comment on function public.get_shochu_keep_reference(boolean) is
  'Read-only bottle keep reference for the authenticated owner. Used by Haraken AI.';

revoke all on function public.get_shochu_keep_reference(boolean) from public;
revoke all on function public.get_shochu_keep_reference(boolean) from anon;
grant execute on function public.get_shochu_keep_reference(boolean) to authenticated;

commit;
