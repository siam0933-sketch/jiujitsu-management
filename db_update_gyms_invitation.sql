-- 1. Add invitation_code column to gyms
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS invitation_code text UNIQUE;

-- 2. Create a function to generate random alphanumeric strings
CREATE OR REPLACE FUNCTION generate_invitation_code(size INT) RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  bytes BYTEA;
  l_res TEXT := '';
  i INT := 0;
BEGIN
  bytes := gen_random_bytes(size);
  WHILE i < size LOOP
    l_res := l_res || substr(characters, (get_byte(bytes, i) % 36) + 1, 1);
    i := i + 1;
  END LOOP;
  RETURN l_res;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. Update existing gyms with a unique, easy-to-read code (e.g., 6 characters)
UPDATE gyms 
SET invitation_code = generate_invitation_code(6) 
WHERE invitation_code IS NULL;

-- 4. Alter the table to make it NOT NULL after backfilling
ALTER TABLE gyms ALTER COLUMN invitation_code SET NOT NULL;
