-- Migration: Add verification confidence scoring columns
-- Phase 1 of verification improvement initiative
-- All columns are nullable with defaults to maintain backward compatibility

-- Add verification scoring columns to test_results
ALTER TABLE public.test_results
  ADD COLUMN IF NOT EXISTS verification_score smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verification_level text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verification_checks jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS content_hash text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS content_simhash text DEFAULT NULL;

-- Index for duplicate detection: find matching hashes per user
CREATE INDEX IF NOT EXISTS test_results_content_hash_idx
  ON public.test_results(user_id, content_hash)
  WHERE content_hash IS NOT NULL;

-- Rollback:
-- ALTER TABLE public.test_results
--   DROP COLUMN IF EXISTS verification_score,
--   DROP COLUMN IF EXISTS verification_level,
--   DROP COLUMN IF EXISTS verification_checks,
--   DROP COLUMN IF EXISTS content_hash,
--   DROP COLUMN IF EXISTS content_simhash;
-- DROP INDEX IF EXISTS test_results_content_hash_idx;
