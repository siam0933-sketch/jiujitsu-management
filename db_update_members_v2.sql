
-- Update gym_members table to support detailed info and access code

-- 1. Add detailed personal info columns
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS guardian_phone text;
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS school text;
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS grade text;

-- 2. Add access_code for Member Portal Login (4-digit PIN)
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS access_code text;

-- 3. Add comment for clarity
COMMENT ON COLUMN gym_members.access_code IS '4-digit PIN for initial member login';
