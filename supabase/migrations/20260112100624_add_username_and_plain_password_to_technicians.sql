/*
  # Add Username and Viewable Password to Technicians

  1. Changes to Existing Tables
    - Add `username` column to `technicians` table (unique, for staff login)
    - Add `password_plain` column to `technicians` table (stores viewable password for admin)

  2. Notes
    - Username is used for staff login instead of email
    - Password is stored in plain text for admin visibility alongside the hash for verification
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'technicians' AND column_name = 'username'
  ) THEN
    ALTER TABLE technicians ADD COLUMN username text UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'technicians' AND column_name = 'password_plain'
  ) THEN
    ALTER TABLE technicians ADD COLUMN password_plain text;
  END IF;
END $$;

DROP FUNCTION IF EXISTS verify_staff_password(text, text);

CREATE FUNCTION verify_staff_password(p_username text, p_password text)
RETURNS TABLE(id uuid, email text, name text, specialty text, avatar_color text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.email, t.name, t.specialty, t.avatar_color
  FROM technicians t
  WHERE t.username = p_username
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
  SET 
    password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')),
    password_plain = p_password
  WHERE id = p_technician_id;
END;
$$;
