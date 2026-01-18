/*
  # Create Ticket Notes Table

  This migration creates a notes table to track all notes/comments added to service tickets.

  1. New Tables
    - `ticket_notes`
      - `id` (uuid, primary key) - Unique identifier for each note
      - `ticket_id` (uuid, foreign key) - Reference to the ticket
      - `content` (text) - The note content
      - `created_by` (text) - Name or identifier of who created the note
      - `created_at` (timestamptz) - Timestamp when the note was created

  2. Security
    - Enable RLS on `ticket_notes` table
    - Add policy for authenticated users to manage notes

  3. Indexes
    - Index on ticket_id for faster lookups
*/

CREATE TABLE IF NOT EXISTS ticket_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by text DEFAULT 'Staff',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_notes_ticket_id ON ticket_notes(ticket_id);

ALTER TABLE ticket_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users on ticket_notes"
  ON ticket_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous access to ticket_notes"
  ON ticket_notes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);