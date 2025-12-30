-- Member Management Enhancements Schema

-- 1. Update Gym Members Table
-- 'start_date': Actual training start date (입문일), distinct from registration date (joined_at)
ALTER TABLE gym_members 
ADD COLUMN IF NOT EXISTS start_date date DEFAULT current_date;

-- 2. Create Membership Pauses Table
-- Tracks periods where the member activity is suspended (휴관)
CREATE TABLE IF NOT EXISTS gym_membership_pauses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id uuid REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES gym_members(id) ON DELETE CASCADE NOT NULL,
  
  start_date date NOT NULL DEFAULT current_date,
  end_date date, -- NULL indicates the pause is currently active
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_membership_pauses_member ON gym_membership_pauses(member_id);
CREATE INDEX IF NOT EXISTS idx_membership_pauses_gym ON gym_membership_pauses(gym_id);

-- 4. RLS Policies
ALTER TABLE gym_membership_pauses ENABLE ROW LEVEL SECURITY;

-- Gym Owners: Full Access
DROP POLICY IF EXISTS "Gym owners can manage pauses" ON gym_membership_pauses;
CREATE POLICY "Gym owners can manage pauses"
  ON gym_membership_pauses FOR ALL
  USING (auth.uid() IN (SELECT owner_id FROM gyms WHERE id = gym_membership_pauses.gym_id));

-- Members: View Only
DROP POLICY IF EXISTS "Members can view own pauses" ON gym_membership_pauses;
CREATE POLICY "Members can view own pauses"
  ON gym_membership_pauses FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM gym_members WHERE id = gym_membership_pauses.member_id));
