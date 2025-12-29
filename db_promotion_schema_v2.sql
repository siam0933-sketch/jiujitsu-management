-- Promotion System V2 Migration
-- Refines the table to support structured Belts and Stripes for Adults and Kids

-- 1. Add new columns to 'gym_promotion_criteria'
ALTER TABLE gym_promotion_criteria
ADD COLUMN IF NOT EXISTS belt_name text, -- e.g. "White", "Gray-White" (Clean name without stripe info)
ADD COLUMN IF NOT EXISTS belt_order int, -- Order of the belt (Adult: 1~5, Kids: 1~13)
ADD COLUMN IF NOT EXISTS stripe_level int, -- Current stripe level (0, 1, 2...)
ADD COLUMN IF NOT EXISTS total_stripes_count int; -- Configured total stripes for this belt (e.g. 4 or 11)

-- 2. Clear old unstructured data (Optional, but recommended to avoid mixing schemas)
-- DELETE FROM gym_promotion_criteria; 

-- 3. Create an index for faster lookup by type and order
CREATE INDEX IF NOT EXISTS idx_promotion_lookup 
ON gym_promotion_criteria (gym_id, type, belt_order, stripe_level);

-- 4. Comment on columns for clarity
COMMENT ON COLUMN gym_promotion_criteria.type IS 'ADULT or KIDS';
COMMENT ON COLUMN gym_promotion_criteria.belt_name IS 'Base name of the belt (e.g. White, Blue)';
COMMENT ON COLUMN gym_promotion_criteria.stripe_level IS 'The stripe level user CURRENTLY has (0 means pure belt)';
COMMENT ON COLUMN gym_promotion_criteria.total_stripes_count IS 'How many stripes exist for this belt in this gym configuration';
