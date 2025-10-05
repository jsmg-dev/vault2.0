-- Migration to add customer_id column to customers table
-- This adds a 12-digit alphanumeric ID field alongside the existing SERIAL id

-- Add the customer_id column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_id VARCHAR(12) UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);

-- Note: Existing records will have NULL customer_id values
-- You can update them with generated IDs if needed




