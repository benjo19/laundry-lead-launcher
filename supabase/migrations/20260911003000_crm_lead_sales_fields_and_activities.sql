ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS contact_outcome text,
  ADD COLUMN IF NOT EXISTS next_step text,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS contact_type text,
  ADD COLUMN IF NOT EXISTS locations_count integer,
  ADD COLUMN IF NOT EXISTS opportunity_value numeric(12,2),
  ADD COLUMN IF NOT EXISTS lost_reason text;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_locations_count_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_locations_count_check
  CHECK (locations_count IS NULL OR locations_count >= 0);

CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type text NOT NULL,
  title text,
  notes text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id_occurred_at
  ON public.lead_activities(lead_id, occurred_at DESC);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view activities for accessible leads" ON public.lead_activities;
DROP POLICY IF EXISTS "Users can insert activities for accessible leads" ON public.lead_activities;
DROP POLICY IF EXISTS "Users can update own activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON public.lead_activities;

CREATE POLICY "Users can view activities for accessible leads"
ON public.lead_activities FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads l
  WHERE l.id = lead_activities.lead_id
    AND (
      l.assigned_to = auth.uid()
      OR (l.assigned_to IS NULL AND l.user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
      )
    )
));

CREATE POLICY "Users can insert activities for accessible leads"
ON public.lead_activities FOR INSERT TO authenticated
WITH CHECK (
  COALESCE(user_id, auth.uid()) = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_activities.lead_id
      AND (
        l.assigned_to = auth.uid()
        OR (l.assigned_to IS NULL AND l.user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
      )
  )
);

CREATE POLICY "Users can update own activities"
ON public.lead_activities FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
);

CREATE POLICY "Users can delete own activities"
ON public.lead_activities FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
);
