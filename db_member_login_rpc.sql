
-- Function to authenticate a member securely (bypassing RLS)
-- This allows the public (anon) to find a member ONLY by providing the correct name and password.

CREATE OR REPLACE FUNCTION authenticate_member(
  p_name text,
  p_password text
) RETURNS SETOF gym_members
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM gym_members
  WHERE name = p_name
  AND login_password = p_password
  LIMIT 1;
END;
$$;

-- Grant execution permission to everyone (anon)
GRANT EXECUTE ON FUNCTION authenticate_member(text, text) TO anon;
GRANT EXECUTE ON FUNCTION authenticate_member(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION authenticate_member(text, text) TO service_role;
