/*
  # Add Customer Approval Cost Fields

  1. New Columns
    - `approved_labor_cost` (numeric) - Approved labor cost for the service
    - `approved_service_cost` (numeric) - Approved service/parts cost

  2. Notes
    - These fields are required when moving a ticket to 'customer_approval' status
    - Both fields are nullable to support existing tickets
*/

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS approved_labor_cost numeric(10, 2),
ADD COLUMN IF NOT EXISTS approved_service_cost numeric(10, 2);
