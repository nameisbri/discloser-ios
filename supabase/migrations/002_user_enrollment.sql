-- Add enrollment fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS alias text UNIQUE,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS pronouns text,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create index for alias lookups (used in sharing)
CREATE INDEX IF NOT EXISTS idx_profiles_alias ON public.profiles(alias);
