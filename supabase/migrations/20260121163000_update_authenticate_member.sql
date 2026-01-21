-- Function to authenticate a member securely (bypassing RLS)
-- Updated to allow case-insensitive name matching

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
  WHERE lower(name) = lower(p_name)
  AND lower(login_password) = lower(p_password)
  LIMIT 1;
END;
$$;

-- Grant execution permission to everyone (anon)
GRANT EXECUTE ON FUNCTION authenticate_member(text, text) TO anon;
GRANT EXECUTE ON FUNCTION authenticate_member(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION authenticate_member(text, text) TO service_role;
