-- Parça envanteri (yönetici paneli — cihaz/makine listesinden ayrı)
CREATE TABLE IF NOT EXISTS parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  part_code text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parts_name ON parts (name);

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to parts"
  ON parts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to parts"
  ON parts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to parts"
  ON parts FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to parts"
  ON parts FOR DELETE
  TO public
  USING (true);
