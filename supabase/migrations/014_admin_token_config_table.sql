-- Replace app.settings approach with a config table for the admin analytics token.
-- Supabase managed Postgres does not allow ALTER DATABASE SET app.settings.*.

-- 1. Create a simple config table (single-row, RLS-blocked for anon/authenticated)
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
-- No RLS policies = no access via PostgREST (anon/authenticated).
-- Only SECURITY DEFINER functions can read it.

-- 2. Insert the admin analytics token
INSERT INTO public.app_config (key, value)
VALUES ('admin_analytics_token', 'CFobco9BJjFVUpQpiZHnjZpZCTgc8dg7')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Update the RPC to read from the config table instead of current_setting()
CREATE OR REPLACE FUNCTION public.get_verification_analytics(admin_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expected_token text;
  result json;
BEGIN
  -- Validate admin token against the config table
  SELECT value INTO expected_token
  FROM public.app_config
  WHERE key = 'admin_analytics_token';

  IF expected_token IS NULL OR expected_token = '' OR admin_token IS DISTINCT FROM expected_token THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = 'P0001';
  END IF;

  SELECT json_build_object(
    'total_results', (SELECT count(*) FROM public.test_results),
    'verified_count', (SELECT count(*) FROM public.test_results WHERE is_verified = true),
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
    'with_content_hash', (
      SELECT count(*)
      FROM public.test_results
      WHERE content_hash IS NOT NULL
    ),
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
