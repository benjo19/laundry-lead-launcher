
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';

interface UseLeadAdditionProps {
  onAddLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => void;
  setDiscoveredLeads: (updater: (prevLeads: AnalyzedLead[]) => AnalyzedLead[]) => void;
}

export const useLeadAddition = ({ onAddLead, setDiscoveredLeads }: UseLeadAdditionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const addDiscoveredLead = async (discoveredLead: AnalyzedLead) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Prijava potrebna",
        description: "Morate se prijaviti da biste mogli spremiti leadove. Idite na Settings za prijavu.",
        variant: "destructive",
      });
      return;
    }

    console.log('Adding discovered lead:', discoveredLead.name);
    console.log('User is logged in:', !!user);

    const newLead: Omit<Lead, 'id' | 'dateAdded'> = {
      company: discoveredLead.name,
      location: discoveredLead.address,
      employees: '10-50', // Default estimate
      phone: discoveredLead.phone || '',
      email: discoveredLead.email || '', // Only real scraped emails or empty
      status: 'Nova',
      potential: discoveredLead.aiAnalysis?.potential || 'Srednji',
      notes: `Pronađeno putem Google Maps - Rating: ${discoveredLead.rating || 'N/A'}, Tipovi: ${discoveredLead.types.join(', ')}${discoveredLead.website ? `, Website: ${discoveredLead.website}` : ''}${discoveredLead.emailScraped ? ', Email automatski pronađen na web stranici' : ''}${!discoveredLead.email ? ', Email adresa nije pronađena' : ''}${discoveredLead.aiAnalysis ? `, AI Score: ${discoveredLead.aiAnalysis.score}/10, ${discoveredLead.aiAnalysis.reasoning}` : ''}`
    };

    try {
      console.log('Attempting to add lead through onAddLead prop...');
      onAddLead(newLead);
      console.log('onAddLead called successfully');
      
      // Remove from discovered leads after calling onAddLead
      setDiscoveredLeads(prevLeads => 
        prevLeads.filter(lead => lead.place_id !== discoveredLead.place_id)
      );

      toast({
        title: "Lead uspješno dodan",
        description: `${discoveredLead.name} je dodan u Lead Hunter.`,
      });
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: "Greška pri dodavanju",
        description: "Dogodila se greška pri dodavanju lead-a. Molimo pokušajte ponovno.",
        variant: "destructive",
      });
    }
  };

  return { addDiscoveredLead };
};
