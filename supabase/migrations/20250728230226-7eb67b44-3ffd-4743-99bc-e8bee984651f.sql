-- Add calendar_event_id column to reminders table
ALTER TABLE public.reminders 
ADD COLUMN calendar_event_id TEXT NULL;

-- Add index for faster lookups
CREATE INDEX idx_reminders_calendar_event_id ON public.reminders(calendar_event_id);