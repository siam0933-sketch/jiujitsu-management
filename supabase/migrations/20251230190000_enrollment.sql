-- Link Members to Classes (Enrollment)
create table if not exists gym_class_enrollments (
  id uuid default gen_random_uuid() primary key,
  schedule_id uuid references gym_schedules(id) on delete cascade not null,
  member_id uuid references gym_members(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(schedule_id, member_id)
);

-- RLS for Enrollments
alter table gym_class_enrollments enable row level security;

create policy "Masters can manage enrollments" on gym_class_enrollments
  for all using (
    exists (
      select 1 from gym_schedules
      join gyms on gyms.id = gym_schedules.gym_id
      where gym_schedules.id = gym_class_enrollments.schedule_id
      and gyms.owner_id = auth.uid()
    )
  );

create policy "Everything viewable by everyone" on gym_class_enrollments
  for select using (true); -- Simplify for now, or restrict to own gym

-- Add missing columns to gym_members if they don't exist
-- (Using DO block to avoid errors if column exists, though 'add column if not exists' works in recent PG)
alter table gym_members add column if not exists name text;
alter table gym_members add column if not exists phone text;
alter table gym_members add column if not exists birth_date date;
alter table gym_members add column if not exists gender text;

-- Index for performance
create index if not exists idx_enrollments_schedule on gym_class_enrollments(schedule_id);
create index if not exists idx_enrollments_member on gym_class_enrollments(member_id);
