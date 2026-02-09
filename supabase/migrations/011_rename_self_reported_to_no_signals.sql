-- Migration: Rename verification_level 'self_reported' to 'no_signals'
-- The term 'self_reported' was misleading since the app has no manual entry flow.
-- 'no_signals' accurately reflects that zero recognizable lab signals were detected.

UPDATE public.test_results
SET verification_level = 'no_signals'
WHERE verification_level = 'self_reported';

-- Also update any shared result snapshots that may reference the old level
-- (shared_results stores a snapshot via the get_shared_result RPC which reads
-- verification_level from test_results, so updating test_results is sufficient)

-- Rollback:
-- UPDATE public.test_results
--   SET verification_level = 'self_reported'
--   WHERE verification_level = 'no_signals';
