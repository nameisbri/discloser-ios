-- Migration: Add known_conditions to get_shared_result return type
-- This allows the web share page to display managed condition labels and management method pills

DROP FUNCTION IF EXISTS public.get_shared_result(text);

CREATE FUNCTION public.get_shared_result(share_token text)
RETURNS TABLE (
  test_date date,
  status test_status,
  test_type text,
  sti_results jsonb,
  is_verified boolean,
  show_name boolean,
  display_name text,
  is_valid boolean,
  is_expired boolean,
  is_over_limit boolean,
  known_conditions jsonb
) AS $$
DECLARE
  link_record record;
BEGIN
  -- First, find the link
  SELECT sl.* INTO link_record
  FROM public.share_links sl
  WHERE sl.token = share_token;

  -- If not found, return nothing
  IF link_record IS NULL THEN
    RETURN;
  END IF;

  -- Check if expired
  IF link_record.expires_at <= now() THEN
    RETURN QUERY SELECT
      tr.test_date,
      tr.status,
      tr.test_type,
      tr.sti_results,
      tr.is_verified,
      link_record.show_name,
      link_record.display_name,
      false AS is_valid,
      true AS is_expired,
      false AS is_over_limit,
      p.known_conditions
    FROM public.test_results tr
    LEFT JOIN public.profiles p ON p.id = link_record.user_id
    WHERE tr.id = link_record.test_result_id;
    RETURN;
  END IF;

  -- Check if over view limit
  IF link_record.max_views IS NOT NULL AND link_record.view_count >= link_record.max_views THEN
    RETURN QUERY SELECT
      tr.test_date,
      tr.status,
      tr.test_type,
      tr.sti_results,
      tr.is_verified,
      link_record.show_name,
      link_record.display_name,
      false AS is_valid,
      false AS is_expired,
      true AS is_over_limit,
      p.known_conditions
    FROM public.test_results tr
    LEFT JOIN public.profiles p ON p.id = link_record.user_id
    WHERE tr.id = link_record.test_result_id;
    RETURN;
  END IF;

  -- Valid link - increment view count and return
  UPDATE public.share_links
  SET view_count = view_count + 1
  WHERE token = share_token;

  RETURN QUERY SELECT
    tr.test_date,
    tr.status,
    tr.test_type,
    tr.sti_results,
    tr.is_verified,
    link_record.show_name,
    link_record.display_name,
    true AS is_valid,
    false AS is_expired,
    false AS is_over_limit,
    p.known_conditions
  FROM public.test_results tr
  LEFT JOIN public.profiles p ON p.id = link_record.user_id
  WHERE tr.id = link_record.test_result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
