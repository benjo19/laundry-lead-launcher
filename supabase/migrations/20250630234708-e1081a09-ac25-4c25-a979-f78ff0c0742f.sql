
-- Add make_settings column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN make_settings jsonb DEFAULT '{}'::jsonb;
