
-- Create reminders table
CREATE TABLE public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  date text NOT NULL,
  time text NOT NULL,
  priority text NOT NULL DEFAULT 'Srednji',
  status text NOT NULL DEFAULT 'Aktivan',
  company text NOT NULL,
  lead_id uuid NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own reminders" 
  ON public.reminders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders" 
  ON public.reminders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" 
  ON public.reminders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" 
  ON public.reminders 
  FOR DELETE 
  USING (auth.uid() = user_id);
