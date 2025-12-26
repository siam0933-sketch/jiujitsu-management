
-- Fix RLS Policies for gym_members

-- 1. Enable RLS
ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Gym Masters can view their members" ON gym_members;
DROP POLICY IF EXISTS "Gym Masters can insert members" ON gym_members;
DROP POLICY IF EXISTS "Gym Masters can update their members" ON gym_members;

-- 3. Create permissive policies for Gym Masters

-- VIEW: Allow if the member belongs to a gym owned by the user
CREATE POLICY "Gym Masters can view their members"
ON gym_members FOR SELECT
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- INSERT: Allow if the member is being added to a gym owned by the user
CREATE POLICY "Gym Masters can insert members"
ON gym_members FOR INSERT
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- UPDATE: Allow if the member belongs to a gym owned by the user
CREATE POLICY "Gym Masters can update their members"
ON gym_members FOR UPDATE
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- 4. Reload Schema
NOTIFY pgrst, 'reload schema';
