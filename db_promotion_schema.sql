-- 1. Create Promotion Criteria Table
create table if not exists gym_promotion_criteria (
  id uuid default gen_random_uuid() primary key,
  gym_id uuid references gyms(id) on delete cascade not null,
  current_belt text not null, -- e.g. 'White', 'White 1 Stripe'
  next_belt text not null, -- e.g. 'White 1 Stripe'
  type text default 'all', -- 'adult', 'kids' or 'all'
  required_tenure_months int default 0,
  required_attendance_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Attendance Logs Table
create table if not exists gym_attendance_logs (
  id uuid default gen_random_uuid() primary key,
  gym_id uuid references gyms(id) on delete cascade not null,
  member_id uuid references gym_members(id) on delete cascade not null,
  date date not null default current_date,
  method text default 'manual', -- 'qr', 'manual', 'code'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Update Gym Members Table
alter table gym_members 
add column if not exists last_promotion_date date default current_date,
add column if not exists attendance_count int default 0;

-- 4. RLS Policies

-- Promotion Criteria
alter table gym_promotion_criteria enable row level security;

create policy "Gym owners can manage promotion criteria"
  on gym_promotion_criteria for all
  using (auth.uid() in (select owner_id from gyms where id = gym_promotion_criteria.gym_id));

-- Attendance Logs
alter table gym_attendance_logs enable row level security;

create policy "Gym owners can manage attendance logs"
  on gym_attendance_logs for all
  using (auth.uid() in (select owner_id from gyms where id = gym_attendance_logs.gym_id));

create policy "Members can view their own attendance"
  on gym_attendance_logs for select
  using (auth.uid() in (select user_id from gym_members where id = gym_attendance_logs.member_id));
