create or replace function public.undo_latest_bottle_remaining(
  p_bottle_id uuid,
  p_expected_previous_remaining smallint,
  p_expected_new_remaining smallint
)
returns public.bottles
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_bottle public.bottles;
  v_latest public.remaining_updates;
begin
  if p_expected_previous_remaining < 0 or p_expected_previous_remaining > 100
    or p_expected_new_remaining < 0 or p_expected_new_remaining > 100 then
    raise exception 'Remaining amount must be between 0 and 100';
  end if;

  select *
    into v_bottle
    from public.bottles
   where id = p_bottle_id
     and user_id = auth.uid()
   for update;

  if not found then
    raise exception 'Bottle not found or access denied';
  end if;

  select *
    into v_latest
    from public.remaining_updates
   where bottle_id = p_bottle_id
     and user_id = auth.uid()
   order by updated_at desc, id desc
   limit 1
   for update;

  if not found then
    raise exception 'Remaining history not found';
  end if;

  if v_latest.previous_remaining <> p_expected_previous_remaining
    or v_latest.new_remaining <> p_expected_new_remaining then
    raise exception 'Latest remaining history has changed';
  end if;

  if v_bottle.current_remaining <> v_latest.new_remaining then
    raise exception 'Current remaining amount has changed';
  end if;

  if v_latest.previous_remaining = 0 or v_latest.new_remaining = 0 then
    raise exception 'Finished bottle changes cannot be undone';
  end if;

  if coalesce(v_latest.notes, '') like '直前の残量変更を取り消し%' then
    raise exception 'Undo records cannot be undone';
  end if;

  insert into public.remaining_updates (
    user_id,
    bottle_id,
    previous_remaining,
    new_remaining,
    image_path,
    notes
  ) values (
    auth.uid(),
    p_bottle_id,
    v_latest.new_remaining,
    v_latest.previous_remaining,
    null,
    '直前の残量変更を取り消し'
  );

  update public.bottles
     set current_remaining = v_latest.previous_remaining,
         status = 'active',
         last_updated_at = now()
   where id = p_bottle_id
  returning * into v_bottle;

  return v_bottle;
end;
$function$;

revoke all on function public.undo_latest_bottle_remaining(uuid, smallint, smallint) from public;
grant execute on function public.undo_latest_bottle_remaining(uuid, smallint, smallint) to authenticated;
