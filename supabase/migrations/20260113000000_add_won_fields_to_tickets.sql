-- Add won and won_at fields to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS won BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS won_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_won ON tickets(won) WHERE won = true;
CREATE INDEX IF NOT EXISTS idx_tickets_won_at ON tickets(won_at) WHERE won_at IS NOT NULL;
