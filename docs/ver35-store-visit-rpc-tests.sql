-- Synthetic SELECT-only tests of the deployed function bodies; no real data changes.
select 'get_shochu_keep_navigation_reference' as test, count(*)=3 and count(*) filter(where store_name='A' and last_visited_on='2026-02-02')=2 and count(*) filter(where store_name='B' and last_visited_on is null)=1 and count(*) filter(where store_name='B' and days_since_last_visit is null)=1 as passed from (with fixture_stores as (select id::uuid, '00000000-0000-0000-0000-000000000001'::uuid as user_id, name, null::text as area,null::double precision as latitude,null::double precision as longitude,'{}'::smallint[] as closed_weekdays from (values ('00000000-0000-0000-0000-000000000011','A'),('00000000-0000-0000-0000-000000000012','B')) t(id,name)),
fixture_bottles as (select id::uuid,store_id::uuid,'00000000-0000-0000-0000-000000000001'::uuid as user_id,brand,remaining::smallint as current_remaining,'2020-01-01'::date as kept_at,'2099-12-31'::date as last_visited_at,'active'::text as status from (values ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000011','A1',65),('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000011','A2',90),('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000012','B1',50)) t(id,store_id,brand,remaining)),
fixture_visits as (select '00000000-0000-0000-0000-000000000011'::uuid as store_id,'00000000-0000-0000-0000-000000000001'::uuid as user_id,visited_on::date from (values ('2026-01-01'),('2026-02-02')) t(visited_on)), japan_today as (
    select
      (current_timestamp at time zone 'Asia/Tokyo')::date as today,
      extract(dow from (current_timestamp at time zone 'Asia/Tokyo'))::smallint as weekday
  ),
  latest_visits as (
    select
      visit.store_id,
      max(visit.visited_on)::date as last_visited_on
    from fixture_visits as visit
    where visit.user_id = (select '00000000-0000-0000-0000-000000000001'::uuid)
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
  from fixture_bottles as bottle
  inner join fixture_stores as store
    on store.id = bottle.store_id
   and store.user_id = bottle.user_id
  left join latest_visits
    on latest_visits.store_id = bottle.store_id
  cross join japan_today
  cross join lateral (
    select latest_visits.last_visited_on as last_visited_on
  ) as visit_reference
  where bottle.user_id = (select '00000000-0000-0000-0000-000000000001'::uuid)
    and store.user_id = (select '00000000-0000-0000-0000-000000000001'::uuid)
    and (
      false
      or (bottle.status = 'active' and bottle.current_remaining > 0)
    )
  order by
    visit_reference.last_visited_on desc nulls last,
    store.name,
    bottle.brand) result;
select 'get_shochu_keep_reference' as test, count(*)=3 and count(*) filter(where store_name='A' and last_visited_on='2026-02-02')=2 and count(*) filter(where store_name='B' and last_visited_on is null)=1  as passed from (with fixture_stores as (select id::uuid, '00000000-0000-0000-0000-000000000001'::uuid as user_id, name, null::text as area,null::double precision as latitude,null::double precision as longitude,'{}'::smallint[] as closed_weekdays from (values ('00000000-0000-0000-0000-000000000011','A'),('00000000-0000-0000-0000-000000000012','B')) t(id,name)),
fixture_bottles as (select id::uuid,store_id::uuid,'00000000-0000-0000-0000-000000000001'::uuid as user_id,brand,remaining::smallint as current_remaining,'2020-01-01'::date as kept_at,'2099-12-31'::date as last_visited_at,'active'::text as status from (values ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000011','A1',65),('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000011','A2',90),('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000012','B1',50)) t(id,store_id,brand,remaining)),
fixture_visits as (select '00000000-0000-0000-0000-000000000011'::uuid as store_id,'00000000-0000-0000-0000-000000000001'::uuid as user_id,visited_on::date from (values ('2026-01-01'),('2026-02-02')) t(visited_on)), latest_visits as (
    select
      visit.store_id,
      max(visit.visited_on)::date as last_visited_on
    from fixture_visits as visit
    where visit.user_id = (select '00000000-0000-0000-0000-000000000001'::uuid)
    group by visit.store_id
  )
  select
    bottle.id as bottle_id,
    store.id as store_id,
    store.name as store_name,
    bottle.brand,
    bottle.current_remaining as remaining_percent,
    latest_visits.last_visited_on as last_visited_on,
    bottle.status
  from fixture_bottles as bottle
  inner join fixture_stores as store
    on store.id = bottle.store_id
   and store.user_id = bottle.user_id
  left join latest_visits
    on latest_visits.store_id = bottle.store_id
  where bottle.user_id = (select '00000000-0000-0000-0000-000000000001'::uuid)
    and store.user_id = (select '00000000-0000-0000-0000-000000000001'::uuid)
    and (
      false
      or (bottle.status = 'active' and bottle.current_remaining > 0)
    )
  order by
    latest_visits.last_visited_on desc nulls last,
    store.name,
    bottle.brand) result;

