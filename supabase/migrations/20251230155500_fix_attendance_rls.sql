-- Fix RLS Policy for gym_schedules
-- Splitting 'manage' policy into explicit actions to ensure INSERT works correctly

drop policy if exists "Masters can manage schedules." on gym_schedules;

-- INSERT Policy (Explicit WITH CHECK)
create policy "Masters can insert schedules" on gym_schedules
  for insert with check (
    exists (
      select 1 from gyms
      where gyms.id = gym_schedules.gym_id
      and gyms.owner_id = auth.uid()
    )
  );

-- UPDATE Policy
create policy "Masters can update schedules" on gym_schedules
  for update using (
    exists (
      select 1 from gyms
      where gyms.id = gym_schedules.gym_id
      and gyms.owner_id = auth.uid()
    )
  );

-- DELETE Policy
create policy "Masters can delete schedules" on gym_schedules
  for delete using (
    exists (
      select 1 from gyms
      where gyms.id = gym_schedules.gym_id
      and gyms.owner_id = auth.uid()
    )
  );
