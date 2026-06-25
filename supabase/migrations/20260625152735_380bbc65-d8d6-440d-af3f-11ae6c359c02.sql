
-- 1) Move SECURITY DEFINER helpers out of public (linter 0029)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.has_role(_user_id, 'super_admin'::public.app_role)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_super_admin(uuid) TO authenticated, service_role;

-- Recreate policies to reference private.is_super_admin
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
CREATE POLICY "Super admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
CREATE POLICY "Super admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage all business profiles" ON public.business_profiles;
CREATE POLICY "Super admins can manage all business profiles" ON public.business_profiles
  FOR ALL TO authenticated USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "Super admins can view all business profiles" ON public.business_profiles;
CREATE POLICY "Super admins can view all business profiles" ON public.business_profiles
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage all emails" ON public.emails;
CREATE POLICY "Super admins can manage all emails" ON public.emails
  FOR ALL TO authenticated USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "Super admins can view all emails" ON public.emails;
CREATE POLICY "Super admins can view all emails" ON public.emails
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage all leads" ON public.leads;
CREATE POLICY "Super admins can manage all leads" ON public.leads
  FOR ALL TO authenticated USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "Super admins can view all leads" ON public.leads;
CREATE POLICY "Super admins can view all leads" ON public.leads
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage all reminders" ON public.reminders;
CREATE POLICY "Super admins can manage all reminders" ON public.reminders
  FOR ALL TO authenticated USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "Super admins can view all reminders" ON public.reminders;
CREATE POLICY "Super admins can view all reminders" ON public.reminders
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage all user knowledge" ON public.user_knowledge;
CREATE POLICY "Super admins can manage all user knowledge" ON public.user_knowledge
  FOR ALL TO authenticated USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "Super admins can view all user knowledge" ON public.user_knowledge;
CREATE POLICY "Super admins can view all user knowledge" ON public.user_knowledge
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage all user settings" ON public.user_settings;
CREATE POLICY "Super admins can manage all user settings" ON public.user_settings
  FOR ALL TO authenticated USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "Super admins can view all user settings" ON public.user_settings;
CREATE POLICY "Super admins can view all user settings" ON public.user_settings
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage global settings" ON public.global_settings;
CREATE POLICY "Super admins can manage global settings" ON public.global_settings
  FOR ALL TO authenticated USING (private.is_super_admin(auth.uid())) WITH CHECK (private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (private.is_super_admin(auth.uid()));

-- Drop public versions now that nothing references them
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 2) Hide all tables/views from the auto-generated GraphQL schema (linter 0027)
-- The app uses PostgREST (REST), not GraphQL, so revoking graphql access is safe.
REVOKE USAGE ON SCHEMA graphql FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA graphql FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA graphql FROM anon, authenticated;
