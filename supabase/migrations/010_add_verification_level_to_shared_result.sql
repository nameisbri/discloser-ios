-- Add verification_level to get_shared_result return type
drop function if exists public.get_shared_result(text);
create function public.get_shared_result(share_token text)
returns table (
  test_date date,
  status test_status,
  test_type text,
  sti_results jsonb,
  is_verified boolean,
  verification_level text,
  show_name boolean,
  display_name text,
  is_valid boolean,
  is_expired boolean,
  is_over_limit boolean,
  known_conditions jsonb,
  created_at timestamptz,
  note text,
  label text
) as $$
declare
  link_record record;
begin
  -- Atomic check-and-increment: only succeeds if within view limit
  update public.share_links
  set view_count = view_count + 1
  where token = share_token
    and (expires_at is null or expires_at > now())
    and (max_views is null or view_count < max_views)
  returning * into link_record;

  -- If the atomic update succeeded, the link is valid
  if FOUND then
    return query select
      tr.test_date,
      tr.status,
      tr.test_type,
      tr.sti_results,
      tr.is_verified,
      tr.verification_level,
      link_record.show_name,
      case when link_record.show_name then p.display_name else null end,
      true as is_valid,
      false as is_expired,
      false as is_over_limit,
      p.known_conditions,
      link_record.created_at,
      link_record.note,
      link_record.label
    from public.test_results tr
    left join public.profiles p on p.id = link_record.user_id
    where tr.id = link_record.test_result_id;
    return;
  end if;

  -- Update failed — re-fetch to determine why
  select sl.* into link_record
  from public.share_links sl
  where sl.token = share_token;

  if not FOUND then
    return;
  end if;

  if link_record.expires_at is not null and link_record.expires_at <= now() then
    return query select
      tr.test_date,
      tr.status,
      tr.test_type,
      tr.sti_results,
      tr.is_verified,
      tr.verification_level,
      link_record.show_name,
      case when link_record.show_name then p.display_name else null end,
      false as is_valid,
      true as is_expired,
      false as is_over_limit,
      p.known_conditions,
      link_record.created_at,
      link_record.note,
      link_record.label
    from public.test_results tr
    left join public.profiles p on p.id = link_record.user_id
    where tr.id = link_record.test_result_id;
    return;
  end if;

  -- Must be over view limit
  return query select
    tr.test_date,
    tr.status,
    tr.test_type,
    tr.sti_results,
    tr.is_verified,
    tr.verification_level,
    link_record.show_name,
    case when link_record.show_name then p.display_name else null end,
    false as is_valid,
    false as is_expired,
    true as is_over_limit,
    p.known_conditions,
    link_record.created_at,
    link_record.note,
    link_record.label
  from public.test_results tr
  left join public.profiles p on p.id = link_record.user_id
  where tr.id = link_record.test_result_id;
end;
$$ language plpgsql security definer;
