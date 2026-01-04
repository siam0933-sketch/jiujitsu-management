-- Add checked_out_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gym_attendance_logs' AND column_name = 'checked_out_at') THEN
        ALTER TABLE gym_attendance_logs ADD COLUMN checked_out_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE gym_attendance_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Owners can view their gym's logs" ON gym_attendance_logs;
DROP POLICY IF EXISTS "Owners can insert their gym's logs" ON gym_attendance_logs;
DROP POLICY IF EXISTS "Owners can update their gym's logs" ON gym_attendance_logs;
DROP POLICY IF EXISTS "Owners can delete their gym's logs" ON gym_attendance_logs;

-- Create Policies
CREATE POLICY "Owners can view their gym's logs" ON gym_attendance_logs
FOR SELECT USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

CREATE POLICY "Owners can insert their gym's logs" ON gym_attendance_logs
FOR INSERT WITH CHECK (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

CREATE POLICY "Owners can update their gym's logs" ON gym_attendance_logs
FOR UPDATE USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);

CREATE POLICY "Owners can delete their gym's logs" ON gym_attendance_logs
FOR DELETE USING (
  gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid())
);
