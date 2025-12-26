
-- Pricing System Tables

-- 1. Price Plans (기간권/횟수권)
CREATE TABLE IF NOT EXISTS gym_price_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('period', 'session')), -- 'period' or 'session'
  session_count INTEGER, -- Only for session type (e.g. 10)
  duration_days INTEGER, -- Validity in days (e.g. 30 for 1 month)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Price Options (옵션)
CREATE TABLE IF NOT EXISTS gym_price_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL, -- e.g. "차량 운행"
  name TEXT NOT NULL, -- e.g. "이용함"
  price INTEGER NOT NULL DEFAULT 0, -- +/- amount
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add Session Tracking to Members
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gym_members' AND column_name = 'remaining_sessions') THEN
        ALTER TABLE gym_members ADD COLUMN remaining_sessions INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gym_members' AND column_name = 'current_plan_id') THEN
        ALTER TABLE gym_members ADD COLUMN current_plan_id UUID REFERENCES gym_price_plans(id);
    END IF;
END $$;

-- 4. RLS Policies
ALTER TABLE gym_price_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_price_options ENABLE ROW LEVEL SECURITY;

-- Plan Policies
CREATE POLICY "Gym Masters can manage their plans" ON gym_price_plans
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()))
  WITH CHECK (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

-- Option Policies
CREATE POLICY "Gym Masters can manage their options" ON gym_price_options
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()))
  WITH CHECK (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

-- Reload Schema
NOTIFY pgrst, 'reload schema';
