-- Add receipt_number column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(20);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_receipt_number ON payments(receipt_number);

