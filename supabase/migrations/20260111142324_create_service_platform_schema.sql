/*
  # Technical Service Platform Schema

  1. New Tables
    - `technicians`
      - `id` (uuid, primary key)
      - `name` (text) - Technician's full name
      - `email` (text, unique) - Contact email
      - `specialty` (text) - Area of expertise
      - `avatar_color` (text) - Color for avatar display
      - `active` (boolean) - Whether technician is active
      - `created_at` (timestamptz) - Record creation timestamp

    - `devices`
      - `id` (uuid, primary key)
      - `device_type` (text) - Type of device (laptop, printer, phone, etc.)
      - `serial_number` (text, unique) - Device serial number
      - `customer_name` (text) - Customer/owner name
      - `model` (text) - Device model
      - `created_at` (timestamptz) - Record creation timestamp

    - `tickets`
      - `id` (uuid, primary key)
      - `title` (text) - Short ticket description
      - `description` (text) - Detailed issue description
      - `status` (text) - Ticket status (new, assigned, in_progress, resolved, closed)
      - `priority` (text) - Priority level (low, medium, high, urgent)
      - `device_id` (uuid, foreign key) - Related device
      - `assigned_to` (uuid, foreign key, nullable) - Assigned technician
      - `created_at` (timestamptz) - Ticket creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on all tables
    - Add permissive policies for public access (can be restricted later with auth)
*/

-- Create technicians table
CREATE TABLE IF NOT EXISTS technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  specialty text NOT NULL DEFAULT '',
  avatar_color text NOT NULL DEFAULT '#3B82F6',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type text NOT NULL,
  serial_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  model text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'medium',
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES technicians(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_device_id ON tickets(device_id);

-- Enable RLS
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Permissive policies for demo purposes (allow all operations)
-- In production, these should be restricted based on authentication

CREATE POLICY "Allow public read access to technicians"
  ON technicians FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to technicians"
  ON technicians FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to technicians"
  ON technicians FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to technicians"
  ON technicians FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to devices"
  ON devices FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to devices"
  ON devices FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to devices"
  ON devices FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to devices"
  ON devices FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to tickets"
  ON tickets FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to tickets"
  ON tickets FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to tickets"
  ON tickets FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to tickets"
  ON tickets FOR DELETE
  TO public
  USING (true);

-- Insert sample data
INSERT INTO technicians (name, email, specialty, avatar_color) VALUES
  ('Sarah Chen', 'sarah.chen@techservice.com', 'Hardware Specialist', '#EF4444'),
  ('Mike Johnson', 'mike.johnson@techservice.com', 'Software Engineer', '#10B981'),
  ('Emily Rodriguez', 'emily.rodriguez@techservice.com', 'Network Technician', '#F59E0B'),
  ('David Kim', 'david.kim@techservice.com', 'Systems Administrator', '#8B5CF6')
ON CONFLICT (email) DO NOTHING;

-- Insert sample devices
INSERT INTO devices (device_type, serial_number, customer_name, model) VALUES
  ('Laptop', 'LPT-2024-001', 'Acme Corp', 'Dell XPS 15'),
  ('Printer', 'PRT-2024-002', 'Global Industries', 'HP LaserJet Pro'),
  ('Phone', 'PHN-2024-003', 'Tech Startup Inc', 'iPhone 15 Pro'),
  ('Server', 'SRV-2024-004', 'Finance Co', 'Dell PowerEdge R740'),
  ('Laptop', 'LPT-2024-005', 'Marketing Agency', 'MacBook Pro 16"')
ON CONFLICT (serial_number) DO NOTHING;

-- Insert sample tickets
INSERT INTO tickets (title, description, status, priority, device_id, assigned_to) 
SELECT 
  'Screen flickering issue',
  'Customer reports intermittent screen flickering, especially when running graphics-intensive applications.',
  'new',
  'high',
  d.id,
  NULL
FROM devices d WHERE d.serial_number = 'LPT-2024-001'
ON CONFLICT DO NOTHING;

INSERT INTO tickets (title, description, status, priority, device_id, assigned_to)
SELECT 
  'Paper jam recurring',
  'Printer experiencing frequent paper jams. Needs inspection and possible roller replacement.',
  'assigned',
  'medium',
  d.id,
  t.id
FROM devices d, technicians t 
WHERE d.serial_number = 'PRT-2024-002' AND t.email = 'sarah.chen@techservice.com'
ON CONFLICT DO NOTHING;

INSERT INTO tickets (title, description, status, priority, device_id, assigned_to)
SELECT 
  'Battery draining quickly',
  'Phone battery drops from 100% to 20% within 3 hours of normal use.',
  'in_progress',
  'medium',
  d.id,
  t.id
FROM devices d, technicians t 
WHERE d.serial_number = 'PHN-2024-003' AND t.email = 'mike.johnson@techservice.com'
ON CONFLICT DO NOTHING;

INSERT INTO tickets (title, description, status, priority, device_id, assigned_to)
SELECT 
  'Server overheating alerts',
  'Multiple temperature warnings. Server room HVAC may need attention.',
  'resolved',
  'urgent',
  d.id,
  t.id
FROM devices d, technicians t 
WHERE d.serial_number = 'SRV-2024-004' AND t.email = 'david.kim@techservice.com'
ON CONFLICT DO NOTHING;