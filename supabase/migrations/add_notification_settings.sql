-- Add notification settings columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT true;
