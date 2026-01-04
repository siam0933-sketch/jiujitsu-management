-- Fix Promotion Logs Schema & RLS

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS gym_promotion_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id uuid REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES gym_members(id) ON DELETE CASCADE NOT NULL,
  
  -- Details
  belt_name text NOT NULL,
  stripe_level int DEFAULT 0,
  
  -- Stats
  promoted_at date DEFAULT current_date NOT NULL,
  training_days int DEFAULT 0,
  attendance_count int DEFAULT 0,
  
  -- Meta
  awarded_by text,
  memo text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexes (Safe Creation)
CREATE INDEX IF NOT EXISTS idx_promotion_logs_member ON gym_promotion_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_promotion_logs_gym ON gym_promotion_logs(gym_id);

-- 3. RLS
ALTER TABLE gym_promotion_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts or outdated logic
DROP POLICY IF EXISTS "Gym owners can manage promotion logs" ON gym_promotion_logs;
DROP POLICY IF EXISTS "Members can view own promotion logs" ON gym_promotion_logs;

-- Re-create Policies
CREATE POLICY "Gym owners can manage promotion logs"
  ON gym_promotion_logs FOR ALL
  USING (
    exists (
      select 1 from gyms
      where gyms.id = gym_promotion_logs.gym_id
      and gyms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can view own promotion logs"
  ON gym_promotion_logs FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM gym_members WHERE id = gym_promotion_logs.member_id));

-- 4. Ensure gym_members has columns
ALTER TABLE gym_members 
ADD COLUMN IF NOT EXISTS last_promotion_date date DEFAULT current_date;
-- Belt column normally exists from initial schema, usually text.

-- 5. Force Refresh Schema Cache (optional, but good practice in Supabase dashboard)
NOTIFY pgrst, 'reload config';
