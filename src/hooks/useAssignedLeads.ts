import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types';
import { fetchAllLeadRows } from '@/lib/fetchAllLeadRows';

type LeadRow = {
  id: string;
  user_id: string | null;
  assigned_to: string | null;
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
  next_step: string | null;
  next_action_at: string | null;
  last_contact_at: string | null;
  contact_outcome: string | null;
  contact_type: string | null;
  locations_count: number | null;
  won_locations_count: number | null;
  opportunity_value: number | null;
  actual_mrr: number | null;
  source: string | null;
  created_at: string | null;
};

const legacyNumericId = (uuid: string) => Number.parseInt(uuid.replace(/-/g, '').slice(0, 12), 16);
const normalize = (value?: string | null) => (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const normalizePhone = (value?: string | null) => (value || '').replace(/\D/g, '');
const domainOf = (value?: string | null) => {
  const raw = (value || '').trim().toLowerCase();
  if (!raw) return '';
  try {
    const url = raw.startsWith('http') ? raw : `https://${raw}`;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return raw.replace(/^www\./, '').split('/')[0];
  }
};

const mapRow = (row: LeadRow): Lead => ({
  id: legacyNumericId(row.id),
  uuid: row.id,
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
  user_id: row.user_id || undefined,
  assigned_to: row.assigned_to || undefined,
  next_step: row.next_step || undefined,
  next_action_at: row.next_action_at || undefined,
  last_contact_at: row.last_contact_at || undefined,
  contact_outcome: row.contact_outcome || undefined,
  contact_type: row.contact_type || undefined,
  locations_count: row.locations_count ?? undefined,
  won_locations_count: row.won_locations_count ?? undefined,
  opportunity_value: row.opportunity_value ?? undefined,
  actual_mrr: row.actual_mrr ?? undefined,
  source: row.source || undefined,
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
    const { data, error: queryError } = await fetchAllLeadRows<LeadRow>((from, to) => db
      .from('leads')
      .select('id,user_id,assigned_to,company,location,employees,phone,email,website,status,potential,notes,industry,country,city,interested_in,next_step,next_action_at,last_contact_at,contact_outcome,contact_type,locations_count,won_locations_count,opportunity_value,actual_mrr,source,created_at')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to));

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

    const { data: candidates, error: duplicateError } = await fetchAllLeadRows((from, to) => db
      .from('leads')
      .select('id,company,email,phone,website')
      .order('id', { ascending: true })
      .range(from, to));

    if (duplicateError) {
      toast({ title: 'Greška', description: duplicateError.message, variant: 'destructive' });
      return false;
    }

    const company = normalize(newLeadData.company);
    const email = normalize(newLeadData.email);
    const phone = normalizePhone(newLeadData.phone);
    const domain = domainOf(newLeadData.website);
    const duplicate = (candidates ?? []).find((row: any) =>
      (company && normalize(row.company) === company) ||
      (email && normalize(row.email) === email) ||
      (phone && normalizePhone(row.phone) === phone) ||
      (domain && domainOf(row.website) === domain)
    );

    if (duplicate) {
      toast({
        title: 'Lead već postoji',
        description: `Pronađen je postojeći CRM account za ${duplicate.company}. Otvori postojeći lead umjesto stvaranja duplikata.`,
        variant: 'destructive',
      });
      return false;
    }

    const { error: insertError } = await db.from('leads').insert({
      user_id: user.id,
      created_by: user.id,
      assigned_to: user.id,
      company: newLeadData.company.trim(),
      location: newLeadData.location || null,
      employees: newLeadData.employees || null,
      phone: newLeadData.phone || null,
      email: newLeadData.email || null,
      website: newLeadData.website || null,
      status: newLeadData.status || 'Nova',
      potential: newLeadData.potential || 'Srednji',
      notes: newLeadData.notes || null,
      source: newLeadData.source || 'Manual',
      industry: newLeadData.industry || null,
      country: newLeadData.country || null,
      city: newLeadData.city || null,
      interested_in: newLeadData.interested_in || null,
      next_step: newLeadData.next_step || null,
      locations_count: newLeadData.locations_count ?? null,
      won_locations_count: newLeadData.won_locations_count ?? null,
      opportunity_value: newLeadData.opportunity_value ?? null,
      actual_mrr: newLeadData.actual_mrr ?? null,
    });

    if (insertError) {
      toast({ title: 'Greška', description: insertError.message, variant: 'destructive' });
      return false;
    }

    await fetchLeads();
    toast({ title: 'Lead dodan', description: `${newLeadData.company} je dodan u CRM.` });
    return true;
  };

  const updateLeadStatus = async (leadId: number, status: Lead['status']) => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead?.uuid) return;
    const db = supabase as any;
    const { error: updateError } = await db
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', lead.uuid);

    if (updateError) {
      toast({ title: 'Greška', description: updateError.message, variant: 'destructive' });
      return;
    }
    await fetchLeads();
  };

  return { leads, loading, error, addLead, updateLeadStatus, refreshLeads: fetchLeads };
};
