-- Add 'waiting_approval' status to payments table
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending', 'waiting_approval', 'paid', 'overdue'));

