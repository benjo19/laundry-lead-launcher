import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types';

type LeadRow = {
  id: string;
  company: string;
  location: string | null;
  employees: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: string | null;
  potential: string | null;
  notes: string | null;
  industry: string | null;
  country: string | null;
  city: string | null;
  interested_in: string | null;
  created_at: string | null;
};

const mapRow = (row: LeadRow): Lead => ({
  id: parseInt(row.id.replace(/-/g, ''), 16),
  company: row.company,
  location: row.location || '',
  employees: row.employees || '',
  phone: row.phone || '',
  email: row.email || '',
  website: row.website || '',
  status: (row.status as Lead['status']) || 'Nova',
  potential: (row.potential as Lead['potential']) || 'Srednji',
  dateAdded: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  industry: row.industry || '',
  notes: row.notes || '',
  country: row.country || undefined,
  city: row.city || undefined,
  interested_in: row.interested_in || undefined,
});

export const useAssignedLeads = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const db = supabase as any;
    const { data, error: queryError } = await db
      .from('leads')
      .select('id,company,location,employees,phone,email,website,status,potential,notes,industry,country,city,interested_in,created_at')
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('Assigned leads load error:', queryError);
      setError(queryError.message || 'Nije moguće učitati leadove.');
      setLoading(false);
      return;
    }

    setLeads((data ?? []).map(mapRow));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const addLead = async (newLeadData: Omit<Lead, 'id' | 'dateAdded'>) => {
    if (!user) return false;
    const db = supabase as any;

    const { data: duplicate } = await db
      .from('leads')
      .select('id')
      .eq('company', newLeadData.company)
      .limit(1);

    if (duplicate?.length) {
      toast({
        title: 'Lead već postoji',
        description: `Lead s nazivom "${newLeadData.company}" već postoji među tvojim dodijeljenim leadovima.`,
        variant: 'destructive',
      });
      return false;
    }

    const { error: insertError } = await db.from('leads').insert({
      user_id: user.id,
      created_by: user.id,
      assigned_to: user.id,
      company: newLeadData.company,
      location: newLeadData.location || null,
      employees: newLeadData.employees || null,
      phone: newLeadData.phone || null,
      email: newLeadData.email || null,
      website: newLeadData.website || null,
      status: newLeadData.status || 'Nova',
      potential: newLeadData.potential || 'Srednji',
      notes: newLeadData.notes || null,
      source: 'Manual',
      industry: newLeadData.industry || null,
      country: newLeadData.country || null,
      city: newLeadData.city || null,
      interested_in: newLeadData.interested_in || null,
    });

    if (insertError) {
      toast({ title: 'Greška', description: insertError.message, variant: 'destructive' });
      return false;
    }

    await fetchLeads();
    toast({ title: 'Lead dodan', description: `${newLeadData.company} je dodan u tvoj CRM.` });
    return true;
  };

  const updateLeadStatus = async (leadId: number, status: Lead['status']) => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    const db = supabase as any;
    const { error: updateError } = await db
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('company', lead.company);

    if (updateError) {
      toast({ title: 'Greška', description: updateError.message, variant: 'destructive' });
      return;
    }
    await fetchLeads();
  };

  return { leads, loading, error, addLead, updateLeadStatus, refreshLeads: fetchLeads };
};
