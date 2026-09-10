ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS interested_in text;

COMMENT ON COLUMN public.leads.interested_in IS 'What the lead is interested in / requested solution';
