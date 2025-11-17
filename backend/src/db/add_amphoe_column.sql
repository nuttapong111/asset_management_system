-- Migration: Add amphoe column to assets table
-- This migration adds the amphoe (อำเภอ/เขต) column to the assets table

-- Check if column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'assets' 
        AND column_name = 'amphoe'
    ) THEN
        ALTER TABLE assets ADD COLUMN amphoe VARCHAR(100) NOT NULL DEFAULT '';
        
        -- Update existing rows with empty string if needed
        UPDATE assets SET amphoe = '' WHERE amphoe IS NULL;
    END IF;
END $$;

