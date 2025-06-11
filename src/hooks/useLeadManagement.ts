import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Lead } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useZapierIntegration } from '@/hooks/useZapierIntegration';

export const useLeadManagement = () => {
  const [leads, setLeads] = useLocalStorage<Lead[]>('leads', [
    {
      id: 1,
      company: 'Praonica Split',
      location: 'Split, Croatia',
      employees: '15-25',
      phone: '+385 21 123 456',
      email: 'info@praonica-split.hr',
      status: 'Nova',
      potential: 'Visok',
      dateAdded: '2024-02-10',
      industry: 'Praonice'
    },
    {
      id: 2,
      company: 'Čistoća Zagreb d.o.o.',
      location: 'Zagreb, Croatia',
      employees: '50-100',
      phone: '+385 1 987 654',
      email: 'kontakt@cistoca-zg.hr',
      status: 'Kontaktiran',
      potential: 'Srednji',
      dateAdded: '2024-02-08',
      industry: 'Čišćenje'
    },
    {
      id: 3,
      company: 'Bijelo rublje Rijeka',
      location: 'Rijeka, Croatia',
      employees: '10-20',
      phone: '+385 51 456 789',
      email: 'office@bijelo-rublje.hr',
      status: 'Zainteresiran',
      potential: 'Visok',
      dateAdded: '2024-02-05',
      industry: 'Praonice'
    },
    {
      id: 4,
      company: 'Hotel Dubrovnik',
      location: 'Dubrovnik, Croatia',
      employees: '100-200',
      phone: '+385 20 123 456',
      email: 'reservations@hotel-dubrovnik.hr',
      status: 'Nova',
      potential: 'Visok',
      dateAdded: '2024-02-12',
      industry: 'Hoteli'
    },
    {
      id: 5,
      company: 'Restoran Kod Ante',
      location: 'Pula, Croatia',
      employees: '10-15',
      phone: '+385 52 987 654',
      email: 'info@kod-ante.hr',
      status: 'Kontaktiran',
      potential: 'Srednji',
      dateAdded: '2024-02-09',
      industry: 'Restorani'
    },
    {
      id: 6,
      company: 'Beauty Salon Lux',
      location: 'Osijek, Croatia',
      employees: '5-10',
      phone: '+385 31 456 789',
      email: 'booking@beauty-lux.hr',
      status: 'Nova',
      potential: 'Nizak',
      dateAdded: '2024-02-11',
      industry: 'Ljepota i wellness'
    }
  ]);

  const { toast } = useToast();
  const { triggerNewLead } = useZapierIntegration();

  const checkForDuplicate = (company: string, email: string): boolean => {
    return leads.some(lead => 
      lead.company.toLowerCase() === company.toLowerCase() || 
      lead.email.toLowerCase() === email.toLowerCase()
    );
  };

  const addLead = async (newLeadData: Omit<Lead, 'id' | 'dateAdded'>) => {
    if (checkForDuplicate(newLeadData.company, newLeadData.email)) {
      toast({
        title: "Duplikat pronađen",
        description: `Lead s tim nazivom tvrtke ili email adresom već postoji.`,
        variant: "destructive",
      });
      return;
    }

    const newLead: Lead = {
      ...newLeadData,
      id: Date.now(),
      dateAdded: new Date().toISOString().split('T')[0]
    };
    
    setLeads([...leads, newLead]);
    
    // Trigger Zapier webhook for new lead
    await triggerNewLead(newLead);
    
    toast({
      title: "Lead dodan",
      description: `${newLead.company} je uspješno dodan u sustav.`,
    });
  };

  const updateLeadStatus = (leadId: number, newStatus: Lead['status']) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
    toast({
      title: "Status ažuriran",
      description: "Status lead-a je uspješno ažuriran.",
    });
  };

  const deleteLead = (leadId: number) => {
    const leadToDelete = leads.find(lead => lead.id === leadId);
    setLeads(leads.filter(lead => lead.id !== leadId));
    toast({
      title: "Lead obrisan",
      description: `${leadToDelete?.company} je obrisan iz sustava.`,
    });
  };

  return {
    leads,
    addLead,
    updateLeadStatus,
    deleteLead
  };
};
