-- Orderly Sales Partner CRM: locations and recurring commissions

CREATE TABLE IF NOT EXISTS public.partner_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid NULL REFERENCES public.leads(id) ON DELETE SET NULL,
  location_name text NOT NULL,
  customer_name text NOT NULL,
  city text NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  monthly_commission numeric(10,2) NOT NULL DEFAULT 5.00 CHECK (monthly_commission >= 0),
  activated_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_locations_partner_idx
  ON public.partner_locations(partner_user_id);
CREATE INDEX IF NOT EXISTS partner_locations_status_idx
  ON public.partner_locations(status);
CREATE INDEX IF NOT EXISTS partner_locations_lead_idx
  ON public.partner_locations(lead_id);

ALTER TABLE public.partner_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners can view own locations" ON public.partner_locations;
CREATE POLICY "Partners can view own locations"
ON public.partner_locations FOR SELECT TO authenticated
USING (partner_user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins can manage all partner locations" ON public.partner_locations;
CREATE POLICY "Super admins can manage all partner locations"
ON public.partner_locations FOR ALL TO authenticated
USING (private.is_super_admin(auth.uid()))
WITH CHECK (private.is_super_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.partner_locations(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at timestamptz NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id, period_start)
);

CREATE INDEX IF NOT EXISTS partner_commissions_partner_idx
  ON public.partner_commissions(partner_user_id);
CREATE INDEX IF NOT EXISTS partner_commissions_period_idx
  ON public.partner_commissions(period_start);
CREATE INDEX IF NOT EXISTS partner_commissions_status_idx
  ON public.partner_commissions(status);

ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners can view own commissions" ON public.partner_commissions;
CREATE POLICY "Partners can view own commissions"
ON public.partner_commissions FOR SELECT TO authenticated
USING (partner_user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins can manage all partner commissions" ON public.partner_commissions;
CREATE POLICY "Super admins can manage all partner commissions"
ON public.partner_commissions FOR ALL TO authenticated
USING (private.is_super_admin(auth.uid()))
WITH CHECK (private.is_super_admin(auth.uid()));

-- Keep updated_at current without introducing a dependency on an existing trigger helper.
CREATE OR REPLACE FUNCTION public.set_partner_crm_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS partner_locations_set_updated_at ON public.partner_locations;
CREATE TRIGGER partner_locations_set_updated_at
BEFORE UPDATE ON public.partner_locations
FOR EACH ROW EXECUTE FUNCTION public.set_partner_crm_updated_at();

DROP TRIGGER IF EXISTS partner_commissions_set_updated_at ON public.partner_commissions;
CREATE TRIGGER partner_commissions_set_updated_at
BEFORE UPDATE ON public.partner_commissions
FOR EACH ROW EXECUTE FUNCTION public.set_partner_crm_updated_at();
