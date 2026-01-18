/*
  # Create Authentication System

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `name` (text)
      - `created_at` (timestamptz)
      - `last_login` (timestamptz)

  2. Changes to Existing Tables
    - Add `password_hash` column to `technicians` table for staff login

  3. Security
    - Enable RLS on `admin_users` table
    - Create restrictive policies for admin_users
    - Password is hashed using pgcrypto bcrypt

  4. Initial Data
    - Creates the initial admin account with email: emretarhan@tekodak.com.tr
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL DEFAULT 'Administrator',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users are not publicly readable"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (false);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'technicians' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE technicians ADD COLUMN password_hash text;
  END IF;
END $$;

INSERT INTO admin_users (email, password_hash, name)
VALUES (
  'emretarhan@tekodak.com.tr',
  extensions.crypt('GeciciSifre123!', extensions.gen_salt('bf')),
  'Emre Tarhan'
)
ON CONFLICT (email) DO NOTHING;
