-- Separate lead creator from current owner/assignee.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Existing rows keep the same owner they had before this migration.
UPDATE public.leads
SET created_by = COALESCE(created_by, user_id),
    assigned_to = COALESCE(assigned_to, user_id)
WHERE created_by IS NULL OR assigned_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads(created_by);

-- Keep backwards compatibility with existing inserts while filling ownership fields automatically.
CREATE OR REPLACE FUNCTION private.set_lead_ownership_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.created_by := COALESCE(NEW.created_by, auth.uid(), NEW.user_id);
  NEW.assigned_to := COALESCE(NEW.assigned_to, NEW.user_id, auth.uid());
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.set_lead_ownership_defaults() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS set_lead_ownership_defaults ON public.leads;
CREATE TRIGGER set_lead_ownership_defaults
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION private.set_lead_ownership_defaults();

-- Replace the legacy all-in-one owner policy. After reassignment, the original creator
-- must not keep access simply because user_id still points to them.
DROP POLICY IF EXISTS "Users can only see their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete assigned leads" ON public.leads;

CREATE POLICY "Users can view assigned leads"
ON public.leads FOR SELECT TO authenticated
USING (
  assigned_to = auth.uid()
  OR (assigned_to IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Users can insert their own leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE(created_by, auth.uid()) = auth.uid()
  AND COALESCE(assigned_to, auth.uid()) = auth.uid()
);

CREATE POLICY "Users can update assigned leads"
ON public.leads FOR UPDATE TO authenticated
USING (
  assigned_to = auth.uid()
  OR (assigned_to IS NULL AND user_id = auth.uid())
)
WITH CHECK (
  assigned_to = auth.uid()
  OR (assigned_to IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Users can delete assigned leads"
ON public.leads FOR DELETE TO authenticated
USING (
  assigned_to = auth.uid()
  OR (assigned_to IS NULL AND user_id = auth.uid())
);

-- Existing super-admin policies remain in place and allow owner-level reassignment.