-- Create gym_promotion_criteria table
CREATE TABLE IF NOT EXISTS gym_promotion_criteria (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id uuid REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('ADULT', 'KIDS')),
  
  belt_name text NOT NULL,
  belt_order int NOT NULL,
  stripe_level int NOT NULL,
  total_stripes_count int NOT NULL DEFAULT 4,
  
  required_tenure_months int DEFAULT 0,
  required_attendance_count int DEFAULT 0,
  
  current_belt text,
  next_belt text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotion_criteria_gym ON gym_promotion_criteria(gym_id);
CREATE INDEX IF NOT EXISTS idx_promotion_criteria_gym_type ON gym_promotion_criteria(gym_id, type);

-- RLS
ALTER TABLE gym_promotion_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "StartFresh" ON gym_promotion_criteria; -- Cleanup just in case

CREATE POLICY "Owners can manage promotion criteria"
  ON gym_promotion_criteria FOR ALL
  USING (
    exists (
      select 1 from gyms
      where gyms.id = gym_promotion_criteria.gym_id
      and gyms.owner_id = auth.uid()
    )
  );
