/*
  # Create Authentication Functions

  1. New Functions
    - `verify_admin_password` - Verifies admin login credentials
    - `verify_staff_password` - Verifies staff/technician login credentials
    - `set_technician_password` - Sets password for a technician (used by admin)

  2. Security
    - Functions use pgcrypto for secure password verification
    - Only returns non-sensitive user data on successful auth
*/

CREATE OR REPLACE FUNCTION verify_admin_password(p_email text, p_password text)
RETURNS TABLE(id uuid, email text, name text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.email, a.name
  FROM admin_users a
  WHERE a.email = p_email
    AND a.password_hash = extensions.crypt(p_password, a.password_hash);
END;
$$;

CREATE OR REPLACE FUNCTION verify_staff_password(p_email text, p_password text)
RETURNS TABLE(id uuid, email text, name text, specialty text, avatar_color text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.email, t.name, t.specialty, t.avatar_color
  FROM technicians t
  WHERE t.email = p_email
    AND t.active = true
    AND t.password_hash IS NOT NULL
    AND t.password_hash = extensions.crypt(p_password, t.password_hash);
END;
$$;

CREATE OR REPLACE FUNCTION set_technician_password(p_technician_id uuid, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE technicians
  SET password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
  WHERE id = p_technician_id;
END;
$$;
