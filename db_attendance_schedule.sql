-- Attendance System Schema

-- 1. gym_schedules Table
-- Stores the weekly class schedule configuration.
create table if not exists gym_schedules (
  id uuid default gen_random_uuid() primary key,
  gym_id uuid references gyms(id) not null,
  day_of_week text not null, -- 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  start_time text not null, -- '19:00' (HH:MM format for simplicity in UI sorting)
  class_name text not null, -- 'Evening Gi', 'Morning No-Gi'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table gym_schedules enable row level security;

create policy "Everyone can view schedules." on gym_schedules
  for select using (true);

create policy "Masters can manage schedules." on gym_schedules
  for all using (
    exists (
      select 1 from gyms
      where gyms.id = gym_schedules.gym_id
      and gyms.owner_id = auth.uid()
    )
  );

-- Index for faster lookup by day
create index if not exists idx_gym_schedules_day on gym_schedules(gym_id, day_of_week);

-- 2. Update gym_attendance_logs to support class names
alter table gym_attendance_logs 
add column if not exists class_name text;

