-- Update RPC to be robust against whitespace
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
  WHERE lower(trim(name)) = lower(trim(p_name))
  AND lower(trim(login_password)) = lower(trim(p_password))
  LIMIT 1;
END;
$$;
