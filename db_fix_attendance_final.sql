-- Final Fix for Attendance System

-- 1. Ensure gym_schedules exists
create table if not exists gym_schedules (
  id uuid default gen_random_uuid() primary key,
  gym_id uuid references gyms(id) not null,
  day_of_week text not null,
  start_time text not null,
  class_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Ensure gym_attendance_logs exists
create table if not exists gym_attendance_logs (
  id uuid default gen_random_uuid() primary key,
  gym_id uuid references gyms(id) not null,
  member_id uuid references gym_members(id) not null,
  date date not null,
  method text default 'manual',
  class_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Reset RLS Policies (Fix Permissions)
alter table gym_schedules enable row level security;
alter table gym_attendance_logs enable row level security;

-- Drop old policies to avoid conflicts
drop policy if exists "Masters can Insert schedules" on gym_schedules;
drop policy if exists "Masters can Update schedules" on gym_schedules;
drop policy if exists "Masters can Delete schedules" on gym_schedules;
drop policy if exists "Masters can manage schedules" on gym_schedules;
drop policy if exists "Everyone can view schedules" on gym_schedules;
drop policy if exists "Masters can manage attendance logs" on gym_attendance_logs;

-- Re-create Policies
create policy "Everyone can view schedules" on gym_schedules for select using (true);

create policy "Masters can manage schedules" on gym_schedules
  for all using (
    exists (select 1 from gyms where gyms.id = gym_schedules.gym_id and gyms.owner_id = auth.uid())
  );

create policy "Masters can manage attendance logs" on gym_attendance_logs
  for all using (
    exists (select 1 from gyms where gyms.id = gym_attendance_logs.gym_id and gyms.owner_id = auth.uid())
  );

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload config';
