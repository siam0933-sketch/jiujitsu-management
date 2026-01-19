-- Add login_password column to gym_members table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gym_members' 
        AND column_name = 'login_password'
    ) THEN
        ALTER TABLE "public"."gym_members" 
        ADD COLUMN "login_password" text;
    END IF;
END $$;
