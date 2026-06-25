
REVOKE SELECT ON public.global_settings FROM authenticated;
REVOKE SELECT ON public.oauth_tokens FROM authenticated;
-- user_roles is read by has_role (SECURITY DEFINER) — revoke direct authenticated read
-- But existing policies allow users to see their own roles; keep it accessible to authenticated.
-- subscribers is accessed by the app for current user; keep authenticated SELECT.
