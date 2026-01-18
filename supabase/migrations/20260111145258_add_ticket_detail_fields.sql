/*
  # Add Comprehensive Service Ticket Fields

  This migration adds detailed fields for service tickets to capture complete
  device, customer contact, and billing information.

  1. Device Information Fields
    - `serial_number` (text) - Device serial number
    - `product_type` (text) - Type of product
    - `brand` (text) - Device brand/manufacturer
    - `model` (text) - Device model name
    - `model_number` (text) - Specific model number
    - `custom_code` (text) - Internal custom code
    - `warranty_status` (text) - Warranty status (in_warranty, out_of_warranty, unknown)

  2. Customer Contact Information Fields
    - `customer_full_name` (text) - Customer's full name
    - `customer_phone` (text) - Primary phone number
    - `customer_extension` (text) - Phone extension
    - `customer_email` (text) - Email address
    - `customer_address` (text) - Physical address

  3. Billing Information Fields
    - `billing_company_name` (text) - Company name for billing
    - `billing_address` (text) - Billing address
    - `billing_tax_office` (text) - Tax office name
    - `billing_tax_number` (text) - Tax identification number

  4. Notes
    - All new fields are optional to support gradual data entry
    - Existing tickets will have NULL values for new fields
*/

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS serial_number text,
ADD COLUMN IF NOT EXISTS product_type text,
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS model_number text,
ADD COLUMN IF NOT EXISTS custom_code text,
ADD COLUMN IF NOT EXISTS warranty_status text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS customer_full_name text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS customer_extension text,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_address text,
ADD COLUMN IF NOT EXISTS billing_company_name text,
ADD COLUMN IF NOT EXISTS billing_address text,
ADD COLUMN IF NOT EXISTS billing_tax_office text,
ADD COLUMN IF NOT EXISTS billing_tax_number text;