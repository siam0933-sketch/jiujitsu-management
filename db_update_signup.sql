
-- 1. Add missing columns to profiles
alter table profiles 
add column if not exists phone text;

-- 2. Add missing columns to gyms
alter table gyms 
add column if not exists phone text,
add column if not exists business_registration_number text;

-- 3. Update the trigger function to handle gym creation and new fields
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_gym_id uuid;
begin
  -- Insert into profiles
  insert into public.profiles (id, email, full_name, role, phone)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'gym_member'),
    new.raw_user_meta_data->>'phone'
  );

  -- If the user role is 'gym_master', create a default gym for them
  if (new.raw_user_meta_data->>'role' = 'gym_master') then
    insert into public.gyms (name, owner_id, address, phone, business_registration_number)
    values (
      coalesce(new.raw_user_meta_data->>'gym_name', 'My Gym'),
      new.id,
      new.raw_user_meta_data->>'gym_address',
      new.raw_user_meta_data->>'gym_phone',
      new.raw_user_meta_data->>'business_registration_number'
    ) returning id into new_gym_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;
