
-- Update gym_members table to support billing info

-- Add payment_due_day (Integer 1-31)
ALTER TABLE gym_members ADD COLUMN IF NOT EXISTS payment_due_day integer;

-- Add comment
COMMENT ON COLUMN gym_members.payment_due_day IS 'Monthly billing day (e.g. 25 for 25th)';
