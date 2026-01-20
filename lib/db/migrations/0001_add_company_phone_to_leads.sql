-- Add company_phone column to leads table
-- Personal phone (phone) = from Get Phone button, costs credits
-- Company phone (company_phone) = official company number, displayed on card

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "company_phone" varchar(50);
