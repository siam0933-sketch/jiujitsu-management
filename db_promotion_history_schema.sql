-- Promotion History Logs Migration

-- 1. Create Logs Table
CREATE TABLE IF NOT EXISTS gym_promotion_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id uuid REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES gym_members(id) ON DELETE CASCADE NOT NULL,
  
  -- Details
  belt_name text NOT NULL,        -- e.g. "Blue"
  stripe_level int DEFAULT 0,     -- e.g. 2
  
  -- Stats (Snapshot at time of promotion)
  promoted_at date DEFAULT current_date NOT NULL,
  training_days int DEFAULT 0,    -- Manual or Auto-calculated days
  attendance_count int DEFAULT 0, -- Manual or Auto-calculated count
  
  -- Meta
  awarded_by text,                -- Name of the person who promoted (e.g. Master Kim)
  memo text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_promotion_logs_member ON gym_promotion_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_promotion_logs_gym ON gym_promotion_logs(gym_id);

-- 3. RLS Policies
ALTER TABLE gym_promotion_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Gym Owners can ALL (View, Insert, Update, Delete)
CREATE POLICY "Gym owners can manage promotion logs"
  ON gym_promotion_logs FOR ALL
  USING (auth.uid() IN (SELECT owner_id FROM gyms WHERE id = gym_promotion_logs.gym_id));

-- Policy: Members can VIEW own logs
CREATE POLICY "Members can view own promotion logs"
  ON gym_promotion_logs FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM gym_members WHERE id = gym_promotion_logs.member_id));
