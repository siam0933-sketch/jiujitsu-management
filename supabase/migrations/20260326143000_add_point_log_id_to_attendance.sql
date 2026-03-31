-- Add point_log_id to gym_attendance_logs
-- This links an attendance record to the point log that was granted for it.
-- Used to prevent duplicate point accumulation and to rollback points on cancellation.

ALTER TABLE gym_attendance_logs
  ADD COLUMN IF NOT EXISTS point_log_id UUID REFERENCES gym_point_logs(id) ON DELETE SET NULL;
