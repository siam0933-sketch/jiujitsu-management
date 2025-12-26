
-- 1. Profiles Table (Extends Supabase Auth)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('super_admin', 'gym_master', 'gym_member')) default 'gym_member',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- 2. Gyms Table
create table gyms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references profiles(id) not null,
  address text,
  subscription_status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table gyms enable row level security;

create policy "Gyms are viewable by everyone." on gyms
  for select using (true);

create policy "Masters can create gyms." on gyms
  for insert with check (auth.uid() = owner_id);

-- 3. Gym Members Table
create table gym_members (
  id uuid default gen_random_uuid() primary key,
  gym_id uuid references gyms(id) not null,
  user_id uuid references profiles(id) not null,
  belt text default 'white',
  status text default 'active',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(gym_id, user_id)
);

alter table gym_members enable row level security;

create policy "Members can view their own membership." on gym_members
  for select using (auth.uid() = user_id);

create policy "Gym owners can view members of their gym." on gym_members
  for select using (
    exists (
      select 1 from gyms
      where gyms.id = gym_members.gym_id
      and gyms.owner_id = auth.uid()
    )
  );

-- 4. Attendance Logs
create table attendance_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  gym_id uuid references gyms(id) not null,
  check_in_at timestamp with time zone default timezone('utc'::text, now()) not null,
  class_type text
);

alter table attendance_logs enable row level security;

create policy "Users can see their own attendance." on attendance_logs
  for select using (auth.uid() = user_id);

-- 5. Trigger for new user creation (Optional but recommended)
-- This automatically creates a profile entry when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'gym_member')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger setup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
