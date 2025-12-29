-- Add group_order column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gym_price_options' AND column_name = 'group_order') THEN
        ALTER TABLE gym_price_options ADD COLUMN group_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Initialize group_order based on the creation time of the FIRST option in each group
WITH group_ranks AS (
    SELECT 
        group_name,
        gym_id,
        MIN(created_at) as first_created_at,
        ROW_NUMBER() OVER (PARTITION BY gym_id ORDER BY MIN(created_at) ASC) as rank
    FROM gym_price_options
    GROUP BY group_name, gym_id
)
UPDATE gym_price_options
SET group_order = group_ranks.rank
FROM group_ranks
WHERE gym_price_options.group_name = group_ranks.group_name
  AND gym_price_options.gym_id = group_ranks.gym_id;
