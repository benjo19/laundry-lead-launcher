-- Security hardening migration

-- 1) Make user-documents bucket private again
UPDATE storage.buckets SET public = false WHERE id = 'user-documents';

-- 2) Tighten RLS on subscribers table
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Allow inserts only for the authenticated user (by user_id) or matching auth.email()
CREATE POLICY "insert_own_subscription"
ON public.subscribers
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  (auth.email() IS NOT NULL AND email = auth.email())
);

-- Allow updates only by the owner (by user_id) or matching auth.email()
CREATE POLICY "update_own_subscription"
ON public.subscribers
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  (auth.email() IS NOT NULL AND email = auth.email())
);
