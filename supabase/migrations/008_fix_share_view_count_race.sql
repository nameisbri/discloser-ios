-- Fix TOCTOU race condition in share link view count checks
-- The previous implementation checked view_count >= max_views and then incremented
-- in separate operations. Concurrent requests could both pass the check and both
-- increment, exceeding max_views. This migration makes the check-and-increment atomic.

-- Fix get_shared_status: atomic view count increment
CREATE OR REPLACE FUNCTION public.get_shared_status(share_token text)
RETURNS TABLE (
  status_snapshot jsonb,
  show_name boolean,
  display_name text,
  is_valid boolean,
  is_expired boolean,
  is_over_limit boolean
) AS $$
DECLARE
  link_record record;
BEGIN
  -- Atomic check-and-increment: only succeeds if within view limit
  UPDATE public.status_share_links
  SET view_count = view_count + 1
  WHERE token = share_token
    AND expires_at > now()
    AND (max_views IS NULL OR view_count < max_views)
  RETURNING * INTO link_record;

  -- If the atomic update succeeded, the link is valid
  IF link_record IS NOT NULL THEN
    RETURN QUERY SELECT
      link_record.status_snapshot,
      link_record.show_name,
      link_record.display_name,
      true AS is_valid,
      false AS is_expired,
      false AS is_over_limit;
    RETURN;
  END IF;

  -- Update failed — re-fetch to determine why (expired vs over-limit vs not-found)
  SELECT * INTO link_record
  FROM public.status_share_links
  WHERE token = share_token;

  IF link_record IS NULL THEN
    RETURN;
  END IF;

  IF link_record.expires_at <= now() THEN
    RETURN QUERY SELECT
      link_record.status_snapshot,
      link_record.show_name,
      link_record.display_name,
      false AS is_valid,
      true AS is_expired,
      false AS is_over_limit;
    RETURN;
  END IF;

  -- Must be over view limit
  RETURN QUERY SELECT
    link_record.status_snapshot,
    link_record.show_name,
    link_record.display_name,
    false AS is_valid,
    false AS is_expired,
    true AS is_over_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_shared_result: atomic view count increment
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
  known_conditions jsonb,
  created_at timestamptz,
  note text,
  label text
) AS $$
DECLARE
  link_record record;
BEGIN
  -- Atomic check-and-increment: only succeeds if within view limit
  UPDATE public.share_links
  SET view_count = view_count + 1
  WHERE token = share_token
    AND expires_at > now()
    AND (max_views IS NULL OR view_count < max_views)
  RETURNING * INTO link_record;

  -- If the atomic update succeeded, the link is valid
  IF link_record IS NOT NULL THEN
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
      p.known_conditions,
      link_record.created_at,
      link_record.note,
      link_record.label
    FROM public.test_results tr
    LEFT JOIN public.profiles p ON p.id = link_record.user_id
    WHERE tr.id = link_record.test_result_id;
    RETURN;
  END IF;

  -- Update failed — re-fetch to determine why
  SELECT sl.* INTO link_record
  FROM public.share_links sl
  WHERE sl.token = share_token;

  IF link_record IS NULL THEN
    RETURN;
  END IF;

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
      p.known_conditions,
      link_record.created_at,
      link_record.note,
      link_record.label
    FROM public.test_results tr
    LEFT JOIN public.profiles p ON p.id = link_record.user_id
    WHERE tr.id = link_record.test_result_id;
    RETURN;
  END IF;

  -- Must be over view limit
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
    p.known_conditions,
    link_record.created_at,
    link_record.note,
    link_record.label
  FROM public.test_results tr
  LEFT JOIN public.profiles p ON p.id = link_record.user_id
  WHERE tr.id = link_record.test_result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
