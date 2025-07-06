
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMakeIntegration } from '@/hooks/useMakeIntegration';
import { Lead } from '@/types';

interface SupabaseLead {
  id: string;
  user_id: string;
  company: string;
  location: string | null;
  employees: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: string | null;
  potential: string | null;
  notes: string | null;
  source: string | null;
  industry: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useSupabaseLeads = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerWebhook } = useMakeIntegration();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapSupabaseToLead = (supabaseLead: SupabaseLead): Lead => ({
    id: parseInt(supabaseLead.id.replace(/-/g, ''), 16), // Convert UUID to number for compatibility
    company: supabaseLead.company,
    location: supabaseLead.location || '',
    employees: supabaseLead.employees || '',
    phone: supabaseLead.phone || '',
    email: supabaseLead.email || '',
    status: (supabaseLead.status as Lead['status']) || 'Nova',
    potential: (supabaseLead.potential as Lead['potential']) || 'Srednji',
    dateAdded: supabaseLead.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    industry: supabaseLead.industry || '',
    notes: supabaseLead.notes || ''
  });

  const fetchLeads = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching leads from Supabase for user:', user.id);

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        setError(error.message);
        return;
      }

      console.log('Fetched leads from Supabase:', data?.length || 0);
      const mappedLeads = data?.map(mapSupabaseToLead) || [];
      setLeads(mappedLeads);
    } catch (err) {
      console.error('Exception fetching leads:', err);
      setError('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const addLead = async (newLeadData: Omit<Lead, 'id' | 'dateAdded'>) => {
    if (!user) {
      toast({
        title: "Greška",
        description: "Morate biti prijavljeni za dodavanje leadova.",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('Adding lead to Supabase:', newLeadData);
      const { error } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          company: newLeadData.company,
          location: newLeadData.location || null,
          employees: newLeadData.employees || null,
          phone: newLeadData.phone || null,
          email: newLeadData.email || null,
          website: null,
          status: newLeadData.status || 'Nova',
          potential: newLeadData.potential || 'Srednji',
          notes: newLeadData.notes || null,
          source: 'Manual',
          industry: newLeadData.industry || null
        });

      if (error) {
        console.error('Error adding lead:', error);
        toast({
          title: "Greška",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      await fetchLeads(); // Refresh the list
      
      // Trigger Make.com webhook for Google Sheets
      console.log('About to trigger Make.com webhook...');
      const webhookResult = await triggerWebhook('lead_added', {
        company: newLeadData.company,
        location: newLeadData.location || '',
        employees: newLeadData.employees || '',
        phone: newLeadData.phone || '',
        email: newLeadData.email || '',
        status: newLeadData.status || 'Nova',
        potential: newLeadData.potential || 'Srednji',
        industry: newLeadData.industry || '',
        notes: newLeadData.notes || '',
        dateAdded: new Date().toISOString().split('T')[0],
        action: 'ADDED'
      });
      
      console.log('Make.com webhook result:', webhookResult);
      
      toast({
        title: "Lead dodan",
        description: `${newLeadData.company} je uspješno dodan u sustav.`,
      });
      return true;
    } catch (err) {
      console.error('Exception adding lead:', err);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom dodavanja lead-a.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateLeadStatus = async (leadId: number, newStatus: Lead['status']) => {
    if (!user) return;

    try {
      // Find the lead to get its UUID
      const leadToUpdate = leads.find(lead => lead.id === leadId);
      if (!leadToUpdate) return;

      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('company', leadToUpdate.company); // Use company as identifier since we can't reverse the UUID conversion

      if (error) {
        console.error('Error updating lead status:', error);
        toast({
          title: "Greška",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      await fetchLeads(); // Refresh the list
      
      // Trigger Make.com webhook for Google Sheets
      await triggerWebhook('lead_updated', {
        company: leadToUpdate.company,
        location: leadToUpdate.location,
        employees: leadToUpdate.employees,
        phone: leadToUpdate.phone,
        email: leadToUpdate.email,
        status: newStatus,
        potential: leadToUpdate.potential,
        industry: leadToUpdate.industry,
        notes: leadToUpdate.notes,
        dateAdded: leadToUpdate.dateAdded,
        action: 'STATUS_UPDATED',
        oldStatus: leadToUpdate.status,
        newStatus: newStatus
      });
      
      toast({
        title: "Status ažuriran",
        description: "Status lead-a je uspješno ažuriran.",
      });
    } catch (err) {
      console.error('Exception updating lead status:', err);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom ažuriranja statusa.",
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (leadId: number) => {
    if (!user) return;

    try {
      // Find the lead to get its info
      const leadToDelete = leads.find(lead => lead.id === leadId);
      if (!leadToDelete) return;

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('user_id', user.id)
        .eq('company', leadToDelete.company); // Use company as identifier

      if (error) {
        console.error('Error deleting lead:', error);
        toast({
          title: "Greška",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      await fetchLeads(); // Refresh the list
      
      // Trigger Make.com webhook for Google Sheets
      await triggerWebhook('lead_deleted', {
        company: leadToDelete.company,
        location: leadToDelete.location,
        employees: leadToDelete.employees,
        phone: leadToDelete.phone,
        email: leadToDelete.email,
        status: leadToDelete.status,
        potential: leadToDelete.potential,
        industry: leadToDelete.industry,
        notes: leadToDelete.notes,
        dateAdded: leadToDelete.dateAdded,
        action: 'DELETED'
      });
      
      toast({
        title: "Lead obrisan",
        description: `${leadToDelete.company} je obrisan iz sustava.`,
      });
    } catch (err) {
      console.error('Exception deleting lead:', err);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom brisanja lead-a.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [user]);

  return {
    leads,
    loading,
    error,
    addLead,
    updateLeadStatus,
    deleteLead,
    refreshLeads: fetchLeads
  };
};
