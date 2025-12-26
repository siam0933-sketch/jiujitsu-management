
-- Payment System Tables

-- 1. Payments Table (History)
CREATE TABLE IF NOT EXISTS gym_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES gym_members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'card', -- card, cash, transfer, etc.
  plan_snapshot JSONB, -- Stores the plan details at the time of payment
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns to gym_members (if not already added in previous steps, just safety check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gym_members' AND column_name = 'payment_start_date') THEN
        ALTER TABLE gym_members ADD COLUMN payment_start_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gym_members' AND column_name = 'payment_end_date') THEN
        ALTER TABLE gym_members ADD COLUMN payment_end_date DATE;
    END IF;
END $$;

-- 3. RLS Policies
ALTER TABLE gym_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gym Masters can manage their payments" ON gym_payments
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()))
  WITH CHECK (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

-- Reload Schema
NOTIFY pgrst, 'reload schema';
