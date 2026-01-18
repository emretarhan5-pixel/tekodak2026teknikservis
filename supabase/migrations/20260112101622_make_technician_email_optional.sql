/*
  # Make technician email optional

  1. Changes
    - Make `email` column nullable in `technicians` table
    - This allows technicians to be created with just username/password

  2. Notes
    - Existing technicians will keep their email addresses
    - New technicians can be created without email
*/

ALTER TABLE technicians ALTER COLUMN email DROP NOT NULL;
