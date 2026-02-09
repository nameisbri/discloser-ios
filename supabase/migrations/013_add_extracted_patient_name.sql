-- Add extracted_patient_name column to test_results
-- Stores the patient name extracted from the document by the LLM parser,
-- so we can re-run name matching when the user updates their profile name
-- without needing the original document.
ALTER TABLE public.test_results
  ADD COLUMN IF NOT EXISTS extracted_patient_name text;

-- Backfill from verification_checks JSONB where available
-- The name_match check stores details like "Patient name matches profile" or
-- "Patient name does not match profile", but unfortunately the raw extracted name
-- is stored in verificationDetails.patientName (not in verification_checks).
-- We cannot backfill from the current data, so only newly uploaded results will have this field.
