/*
  # Add Invoice Fields to Tickets

  1. New Columns
    - `invoice_number` (text) - The invoice number for the service
    - `total_service_amount` (numeric) - Total service amount excluding VAT

  2. Notes
    - These fields are required when moving a ticket to 'invoicing' status
    - Both fields are nullable to support existing tickets
*/

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS invoice_number text,
ADD COLUMN IF NOT EXISTS total_service_amount numeric(10, 2);
