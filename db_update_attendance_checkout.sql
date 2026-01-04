-- Add checked_out_at to gym_attendance_logs
alter table gym_attendance_logs
add column checked_out_at timestamp with time zone;

-- Update RLS if needed (already broad usually, but good to check)
