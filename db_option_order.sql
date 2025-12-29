-- Add display_order column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gym_price_options' AND column_name = 'display_order') THEN
        ALTER TABLE gym_price_options ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing records to have a sequential order based on creation time, partitioned by group
WITH ordered_options AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY gym_id, group_name ORDER BY created_at ASC) as rn
    FROM gym_price_options
)
UPDATE gym_price_options
SET display_order = ordered_options.rn
FROM ordered_options
WHERE gym_price_options.id = ordered_options.id;
