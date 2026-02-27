-- 1. Add status column to gyms table for the approval system
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- 2. Update all existing gyms to be 'active' so current users aren't locked out
UPDATE gyms SET status = 'active' WHERE status = 'pending';

-- 3. (Optional) Insert a dummy super_admin for testing if one doesn't exist
-- Make sure to replace the email and ID with a real user UID from auth.users if needed.
-- Or simply run this update on your own existing account:
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';
