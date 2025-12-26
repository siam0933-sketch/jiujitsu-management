
-- Update gym_members table to support manual registration

-- 1. Make user_id nullable (for members without app accounts)
ALTER TABLE gym_members ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add new columns for manual entry
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS gender text; -- 'male', 'female'
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS birth_date date;

-- 3. Update existing rows (if any) to have a name from profiles (optional cleanup)
-- Update name from profiles if linked
UPDATE gym_members
SET name = profiles.full_name
FROM profiles
WHERE gym_members.user_id = profiles.id
AND gym_members.name IS NULL;

-- 4. Add constraint to ensure either user_id OR name is present
ALTER TABLE gym_members ADD CONSTRAINT check_member_identity 
CHECK (user_id IS NOT NULL OR name IS NOT NULL);
