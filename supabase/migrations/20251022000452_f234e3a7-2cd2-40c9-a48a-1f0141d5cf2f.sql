-- Create business_profiles table
CREATE TABLE public.business_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  industry TEXT,
  business_description TEXT,
  target_audience TEXT,
  company_values TEXT,
  ai_tone TEXT DEFAULT 'professional',
  ai_goals TEXT[],
  email_signature TEXT,
  website TEXT,
  location TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own business profiles"
ON public.business_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business profiles"
ON public.business_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profiles"
ON public.business_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business profiles"
ON public.business_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_business_profiles_updated_at
BEFORE UPDATE ON public.business_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_knowledge_updated_at();

-- Create index for faster queries
CREATE INDEX idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX idx_business_profiles_is_default ON public.business_profiles(user_id, is_default) WHERE is_default = true;