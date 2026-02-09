-- Migration: Add RPC function for verification analytics dashboard
-- Returns aggregate statistics only — no PII is exposed.
-- Protected by an admin token validated against app.settings.admin_analytics_token.

CREATE OR REPLACE FUNCTION public.get_verification_analytics(admin_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expected_token text;
  result json;
BEGIN
  -- Validate admin token against the Supabase app setting
  expected_token := current_setting('app.settings.admin_analytics_token', true);

  IF expected_token IS NULL OR expected_token = '' OR admin_token IS DISTINCT FROM expected_token THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = 'P0001';
  END IF;

  SELECT json_build_object(
    -- Total result counts
    'total_results', (SELECT count(*) FROM public.test_results),
    'verified_count', (SELECT count(*) FROM public.test_results WHERE is_verified = true),

    -- Distribution of verification levels
    'level_distribution', (
      SELECT json_object_agg(level, cnt)
      FROM (
        SELECT
          COALESCE(verification_level, 'null') AS level,
          count(*) AS cnt
        FROM public.test_results
        GROUP BY COALESCE(verification_level, 'null')
      ) sub
    ),

    -- Score statistics
    'avg_score', (
      SELECT round(avg(verification_score)::numeric, 1)
      FROM public.test_results
      WHERE verification_score IS NOT NULL
    ),
    'median_score', (
      SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY verification_score)
      FROM public.test_results
      WHERE verification_score IS NOT NULL
    ),

    -- Content hash / duplicate detection
    'with_content_hash', (
      SELECT count(*)
      FROM public.test_results
      WHERE content_hash IS NOT NULL
    ),

    -- Last 30 days activity
    'results_last_30d', (
      SELECT count(*)
      FROM public.test_results
      WHERE created_at >= now() - interval '30 days'
    ),
    'verified_last_30d', (
      SELECT count(*)
      FROM public.test_results
      WHERE is_verified = true
        AND created_at >= now() - interval '30 days'
    ),

    -- Top failed verification checks (aggregate from JSONB)
    'top_failed_checks', (
      SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
      FROM (
        SELECT
          check_obj->>'check' AS check_name,
          count(*) AS fail_count
        FROM public.test_results,
          jsonb_array_elements(verification_checks) AS check_obj
        WHERE check_obj->>'passed' = 'false'
        GROUP BY check_obj->>'check'
        ORDER BY count(*) DESC
        LIMIT 10
      ) sub
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Rollback:
-- DROP FUNCTION IF EXISTS public.get_verification_analytics(text);
