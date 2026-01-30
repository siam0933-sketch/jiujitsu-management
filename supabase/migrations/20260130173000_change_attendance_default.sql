-- Change default status of gym_attendance_logs to 'pending'
ALTER TABLE gym_attendance_logs ALTER COLUMN status SET DEFAULT 'pending';
