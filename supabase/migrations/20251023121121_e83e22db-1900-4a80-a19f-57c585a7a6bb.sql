-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
$$;

-- RLS policies for user_roles
CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Create global_settings table
CREATE TABLE public.global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage global settings
CREATE POLICY "Super admins can manage global settings"
ON public.global_settings FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Insert initial global settings
INSERT INTO public.global_settings (setting_key, setting_value, description)
VALUES 
('apify_enabled', '{"enabled": true}'::jsonb, 'Enable Apify for all users'),
('make_webhook_url', '{"url": ""}'::jsonb, 'Global Make.com webhook URL for all users'),
('zapier_webhook_url', '{"url": ""}'::jsonb, 'Global Zapier webhook URL for all users'),
('content_booster_webhook_url', '{"url": ""}'::jsonb, 'Global Content Booster webhook URL');

-- Add super admin policies to existing tables

-- leads table
CREATE POLICY "Super admins can view all leads"
ON public.leads FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all leads"
ON public.leads FOR ALL
USING (public.is_super_admin(auth.uid()));

-- reminders table
CREATE POLICY "Super admins can view all reminders"
ON public.reminders FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all reminders"
ON public.reminders FOR ALL
USING (public.is_super_admin(auth.uid()));

-- emails table
CREATE POLICY "Super admins can view all emails"
ON public.emails FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all emails"
ON public.emails FOR ALL
USING (public.is_super_admin(auth.uid()));

-- user_settings table
CREATE POLICY "Super admins can view all user settings"
ON public.user_settings FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all user settings"
ON public.user_settings FOR ALL
USING (public.is_super_admin(auth.uid()));

-- business_profiles table
CREATE POLICY "Super admins can view all business profiles"
ON public.business_profiles FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all business profiles"
ON public.business_profiles FOR ALL
USING (public.is_super_admin(auth.uid()));

-- user_knowledge table
CREATE POLICY "Super admins can view all user knowledge"
ON public.user_knowledge FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all user knowledge"
ON public.user_knowledge FOR ALL
USING (public.is_super_admin(auth.uid()));

-- profiles table
CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Create trigger to auto-assign user role on signup
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();

-- Set super admin for mateoseba010@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'mateoseba010@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;