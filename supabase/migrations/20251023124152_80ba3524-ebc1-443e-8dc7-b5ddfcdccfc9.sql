-- Add zapier_settings and google_calendar_settings to user_settings table
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS zapier_settings jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS google_calendar_settings jsonb DEFAULT '{}'::jsonb;

-- Add helpful comment
COMMENT ON COLUMN public.user_settings.zapier_settings IS 'User-specific Zapier webhook configuration';
COMMENT ON COLUMN public.user_settings.google_calendar_settings IS 'User-specific Google Calendar integration settings';