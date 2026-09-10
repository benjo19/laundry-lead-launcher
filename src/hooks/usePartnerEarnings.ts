import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

type PartnerLocation = {
  id: string;
  customer_name: string;
  location_name: string;
  city: string | null;
  status: 'active' | 'inactive';
  monthly_commission: number;
  activated_at: string;
};

type PartnerCommission = {
  id: string;
  location_id: string;
  period_start: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paid_at: string | null;
};

export const usePartnerEarnings = () => {
  const { user } = useAuthContext();
  const [locations, setLocations] = useState<PartnerLocation[]>([]);
  const [commissions, setCommissions] = useState<PartnerCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user) {
        if (mounted) {
          setLocations([]);
          setCommissions([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      // These tables are introduced by the partner CRM migration. Cast locally so the
      // branch can compile before generated Supabase types are refreshed in Lovable.
      const db = supabase as any;
      const [{ data: locationData, error: locationError }, { data: commissionData, error: commissionError }] = await Promise.all([
        db
          .from('partner_locations')
          .select('id, customer_name, location_name, city, status, monthly_commission, activated_at')
          .eq('partner_user_id', user.id)
          .order('activated_at', { ascending: false }),
        db
          .from('partner_commissions')
          .select('id, location_id, period_start, amount, status, paid_at')
          .eq('partner_user_id', user.id)
          .order('period_start', { ascending: false }),
      ]);

      if (!mounted) return;

      if (locationError || commissionError) {
        setError(locationError?.message || commissionError?.message || 'Nije moguće učitati provizije.');
        setLoading(false);
        return;
      }

      setLocations((locationData ?? []).map((row: any) => ({
        ...row,
        monthly_commission: Number(row.monthly_commission ?? 0),
      })));
      setCommissions((commissionData ?? []).map((row: any) => ({
        ...row,
        amount: Number(row.amount ?? 0),
      })));
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const summary = useMemo(() => {
    const activeLocations = locations.filter((location) => location.status === 'active');
    const monthlyRecurring = activeLocations.reduce((sum, location) => sum + location.monthly_commission, 0);
    const pending = commissions
      .filter((commission) => commission.status === 'pending' || commission.status === 'approved')
      .reduce((sum, commission) => sum + commission.amount, 0);
    const paid = commissions
      .filter((commission) => commission.status === 'paid')
      .reduce((sum, commission) => sum + commission.amount, 0);

    return {
      activeLocations: activeLocations.length,
      monthlyRecurring,
      pending,
      paid,
    };
  }, [locations, commissions]);

  return { locations, commissions, summary, loading, error };
};
