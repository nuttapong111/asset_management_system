-- Add contract_number column to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_number VARCHAR(20);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);

-- Create index for owner-based queries
CREATE INDEX IF NOT EXISTS idx_contracts_owner_year ON contracts(asset_id, created_at);

