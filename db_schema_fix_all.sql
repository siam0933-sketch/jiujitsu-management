
-- Consolidated Schema Fix & Reload
-- Run this to ensure ALL required columns exist.

-- 1. Ensure Columns Exist (Safe to run multiple times)
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS guardian_phone text;
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS school text;
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS access_code text;
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS payment_due_day integer;

-- 2. Force Schema Cache Reload (Crucial for 'Could not find column' errors)
NOTIFY pgrst, 'reload schema';
