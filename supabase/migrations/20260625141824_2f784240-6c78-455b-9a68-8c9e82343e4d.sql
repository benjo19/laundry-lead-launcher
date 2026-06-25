
-- 1. Storage: UPDATE policy for business-documents (user-documents already has one)
CREATE POLICY "Users can update their own business documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'business-documents' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'business-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2. Avatars: replace broad public SELECT to prevent listing (public URLs continue to work via bucket public flag)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- 3. oauth_tokens: SELECT + UPDATE policies for owner
CREATE POLICY "Users can view their own oauth tokens"
ON public.oauth_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own oauth tokens"
ON public.oauth_tokens FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Revoke anon SELECT on sensitive tables (fixes GraphQL anon exposure for these)
REVOKE SELECT ON public.oauth_tokens FROM anon;
REVOKE SELECT ON public.global_settings FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.subscribers FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.emails FROM anon;
REVOKE SELECT ON public.leads FROM anon;
REVOKE SELECT ON public.reminders FROM anon;
REVOKE SELECT ON public.offers FROM anon;
REVOKE SELECT ON public.offer_items FROM anon;
REVOKE SELECT ON public.user_knowledge FROM anon;
REVOKE SELECT ON public.business_profiles FROM anon;
REVOKE SELECT ON public.user_settings FROM anon;

-- 5. Fix function search_path & revoke unneeded EXECUTE on SECURITY DEFINER functions
ALTER FUNCTION public.update_offers_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_knowledge_updated_at() SET search_path = public;

-- Trigger functions should not be callable directly
REVOKE EXECUTE ON FUNCTION public.assign_default_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_knowledge_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_offers_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role / is_super_admin: not needed by anon; keep for authenticated (used in RLS)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
