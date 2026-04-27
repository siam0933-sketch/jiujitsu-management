-- 20260427144500_add_sort_order_to_calendar.sql

ALTER TABLE gym_calendar_classes ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
