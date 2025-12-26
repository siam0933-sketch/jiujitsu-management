
-- Fix: Add missing DELETE policy for gym_members

-- 1. Create DELETE Policy
CREATE POLICY "Gym Masters can delete members"
ON gym_members FOR DELETE
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- 2. Reload Schema to apply changes immediatley
NOTIFY pgrst, 'reload schema';
