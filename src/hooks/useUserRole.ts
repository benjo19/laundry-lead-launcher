import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export type UserRole = 'super_admin' | 'sales_partner' | 'user' | null;

export const useUserRole = () => {
  const { user } = useAuthContext();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to load user role:', error);
        setRole('user');
        setLoading(false);
        return;
      }

      const roles = (data ?? []).map((item) => String(item.role));
      if (roles.includes('super_admin')) setRole('super_admin');
      else if (roles.includes('sales_partner')) setRole('sales_partner');
      else setRole('user');
      setLoading(false);
    };

    loadRole();
  }, [user]);

  return {
    role,
    loading,
    isAdmin: role === 'super_admin',
    isSalesPartner: role === 'sales_partner',
  };
};
