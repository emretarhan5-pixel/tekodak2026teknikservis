/*
  # Separate Invoicing and Delivery Statuses

  1. Changes
    - Splits the combined 'invoicing_delivery' status into two separate statuses:
      - 'invoicing' - For tickets awaiting invoicing
      - 'delivery' - For tickets awaiting delivery
    - Updates existing tickets with 'invoicing_delivery' status to 'invoicing'

  2. Notes
    - Existing tickets in 'invoicing_delivery' are migrated to 'invoicing'
*/

UPDATE tickets
SET status = 'invoicing'
WHERE status = 'invoicing_delivery';
