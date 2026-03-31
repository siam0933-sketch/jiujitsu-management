-- Add icon column to gym_point_settings for per-item emoji icons
ALTER TABLE gym_point_settings ADD COLUMN IF NOT EXISTS icon text;
