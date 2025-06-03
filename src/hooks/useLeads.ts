
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Lead } from '@/types';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load leads from Supabase
  const loadLeads = async () => {
    if (!user) {
      setLeads([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform Supabase data to match our Lead interface
      const transformedLeads: Lead[] = (data || []).map((dbLead) => ({
        id: parseInt(dbLead.id) || Date.now(), // Convert UUID to number for compatibility
        company: dbLead.company,
        location: dbLead.location || '',
        employees: dbLead.employees || '',
        phone: dbLead.phone || '',
        email: dbLead.email || '',
        status: dbLead.status as Lead['status'] || 'Nova',
        potential: dbLead.potential as Lead['potential'] || 'Srednji',
        dateAdded: dbLead.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        notes: dbLead.notes || undefined
      }));

      setLeads(transformedLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom učitavanja leadova.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add new lead to Supabase
  const addLead = async (newLeadData: Omit<Lead, 'id' | 'dateAdded'>) => {
    if (!user) return;

    try {
      // Check for duplicates first
      const { data: existingLeads, error: checkError } = await supabase
        .from('leads')
        .select('company, email')
        .eq('user_id', user.id)
        .or(`company.ilike.${newLeadData.company},email.ilike.${newLeadData.email}`);

      if (checkError) {
        throw checkError;
      }

      if (existingLeads && existingLeads.length > 0) {
        toast({
          title: "Duplikat pronađen",
          description: `Lead s tim nazivom tvrtke ili email adresom već postoji.`,
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          company: newLeadData.company,
          location: newLeadData.location,
          employees: newLeadData.employees,
          phone: newLeadData.phone,
          email: newLeadData.email,
          status: newLeadData.status,
          potential: newLeadData.potential,
          notes: newLeadData.notes,
          source: 'Manual'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Lead dodan",
        description: `${newLeadData.company} je uspješno dodan u sustav.`,
      });

      // Reload leads to get the latest data
      await loadLeads();
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom dodavanja lead-a.",
        variant: "destructive",
      });
    }
  };

  // Update lead status
  const updateLeadStatus = async (leadId: number, newStatus: Lead['status']) => {
    if (!user) return;

    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const { error } = await supabase
        .from('leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('company', lead.company); // Use company as identifier since we're converting UUIDs

      if (error) {
        throw error;
      }

      toast({
        title: "Status ažuriran",
        description: "Status lead-a je uspješno ažuriran.",
      });

      // Update local state
      setLeads(leads.map(l => 
        l.id === leadId ? { ...l, status: newStatus } : l
      ));
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom ažuriranja statusa.",
        variant: "destructive",
      });
    }
  };

  // Delete lead
  const deleteLead = async (leadId: number) => {
    if (!user) return;

    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('user_id', user.id)
        .eq('company', lead.company); // Use company as identifier

      if (error) {
        throw error;
      }

      toast({
        title: "Lead obrisan",
        description: `${lead.company} je obrisan iz sustava.`,
      });

      // Update local state
      setLeads(leads.filter(l => l.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom brisanja lead-a.",
        variant: "destructive",
      });
    }
  };

  // Load leads when user changes
  useEffect(() => {
    loadLeads();
  }, [user]);

  return {
    leads,
    isLoading,
    addLead,
    updateLeadStatus,
    deleteLead,
    loadLeads
  };
};
