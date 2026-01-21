-- Add status column to gym_attendance_logs if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gym_attendance_logs' AND column_name = 'status') THEN
        ALTER TABLE gym_attendance_logs ADD COLUMN status text DEFAULT 'present';
    END IF;
END $$;

-- Drop check constraint if exists to update it or ensure it allows 'pending'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_status_valid') THEN
        ALTER TABLE gym_attendance_logs DROP CONSTRAINT check_status_valid;
    END IF;
END $$;

-- Add check constraint for status values
ALTER TABLE gym_attendance_logs ADD CONSTRAINT check_status_valid CHECK (status IN ('pending', 'present'));

-- Index for faster querying of pending requests
CREATE INDEX IF NOT EXISTS idx_attendance_status ON gym_attendance_logs(status) WHERE status = 'pending';
