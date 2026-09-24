-- Reordering the map from the admin panel. Positions are unique per unit (and per map for units),
-- so the new order is written with the uniqueness check deferred to the end of the transaction.

create function public.reorder_levels(p_unit_id uuid, p_level_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can reorder the map' using errcode = 'insufficient_privilege';
  end if;
  if (select count(*) from public.levels where unit_id = p_unit_id) <> coalesce(array_length(p_level_ids, 1), 0)
     or (select count(distinct id) from public.levels where unit_id = p_unit_id and id = any (p_level_ids)) <> coalesce(array_length(p_level_ids, 1), 0) then
    raise exception 'The order must list every level of the unit exactly once' using errcode = 'invalid_parameter_value';
  end if;

  set constraints public.levels_unit_position_key deferred;
  update public.levels l
  set position = o.ordinality - 1
  from unnest(p_level_ids) with ordinality as o(id, ordinality)
  where l.id = o.id and l.unit_id = p_unit_id;
end;
$$;

create function public.reorder_units(p_unit_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can reorder the map' using errcode = 'insufficient_privilege';
  end if;
  if (select count(*) from public.units) <> coalesce(array_length(p_unit_ids, 1), 0)
     or (select count(distinct id) from public.units where id = any (p_unit_ids)) <> coalesce(array_length(p_unit_ids, 1), 0) then
    raise exception 'The order must list every unit exactly once' using errcode = 'invalid_parameter_value';
  end if;

  set constraints public.units_position_key deferred;
  update public.units u
  set position = o.ordinality - 1
  from unnest(p_unit_ids) with ordinality as o(id, ordinality)
  where u.id = o.id;
end;
$$;

-- Moves a level to the end of another unit.
create function public.move_level(p_level_id uuid, p_unit_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  old_unit uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change the map' using errcode = 'insufficient_privilege';
  end if;
  select unit_id into old_unit from public.levels where id = p_level_id;
  if old_unit is null or old_unit = p_unit_id then
    return;
  end if;

  set constraints public.levels_unit_position_key deferred;
  update public.levels
  set unit_id = p_unit_id,
      position = coalesce((select max(position) + 1 from public.levels where unit_id = p_unit_id), 0)
  where id = p_level_id;
  -- Close the gap in the old unit.
  update public.levels l
  set position = o.rn - 1
  from (select id, row_number() over (order by position) as rn from public.levels where unit_id = old_unit) o
  where l.id = o.id;
end;
$$;

revoke execute on function public.reorder_levels(uuid, uuid[]) from public, anon;
revoke execute on function public.reorder_units(uuid[]) from public, anon;
revoke execute on function public.move_level(uuid, uuid) from public, anon;
grant execute on function public.reorder_levels(uuid, uuid[]) to authenticated;
grant execute on function public.reorder_units(uuid[]) to authenticated;
grant execute on function public.move_level(uuid, uuid) to authenticated;
