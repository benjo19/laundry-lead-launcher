
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';
import { BusinessProfile } from './useBusinessProfile';

interface UseLeadAdditionProps {
  onAddLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => Promise<boolean>;
  setDiscoveredLeads: (updater: (prevLeads: AnalyzedLead[]) => AnalyzedLead[]) => void;
  industry?: string;
  selectedBusinessProfile?: BusinessProfile | null;
}

export const useLeadAddition = ({ onAddLead, setDiscoveredLeads, industry, selectedBusinessProfile }: UseLeadAdditionProps) => {
  const { user } = useAuthContext();
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

    // Extract country from address (last part after comma)
    const addressParts = discoveredLead.address.split(',').map(part => part.trim());
    const country = addressParts.length > 1 ? addressParts[addressParts.length - 1] : '';

    const newLead: Omit<Lead, 'id' | 'dateAdded'> = {
      company: discoveredLead.name,
      location: discoveredLead.address,
      employees: '10-50', // Default estimate
      phone: discoveredLead.phone || '',
      email: discoveredLead.email || '', // Only real scraped emails or empty
      website: discoveredLead.website || '',
      status: 'Nova',
      potential: discoveredLead.aiAnalysis?.potential || 'Srednji',
      industry: industry || '',
      country: country,
      businessProfileId: selectedBusinessProfile?.id,
      businessProfileName: selectedBusinessProfile?.name,
      businessCompanyName: selectedBusinessProfile?.company_name,
      notes: `Pronađeno putem Google Maps - Rating: ${discoveredLead.rating || 'N/A'}, Tipovi: ${discoveredLead.types.join(', ')}${discoveredLead.website ? `, Website: ${discoveredLead.website}` : ''}${discoveredLead.emailScraped ? ', Email automatski pronađen na web stranici' : ''}${!discoveredLead.email ? ', Email adresa nije pronađena' : ''}${discoveredLead.aiAnalysis ? `, AI Score: ${discoveredLead.aiAnalysis.score}/10, ${discoveredLead.aiAnalysis.reasoning}` : ''}`
    };

    try {
      console.log('Attempting to add lead through onAddLead prop...');
      const success = await onAddLead(newLead);
      console.log('onAddLead result:', success);
      
      if (success) {
        // Remove from discovered leads after successful addition
        setDiscoveredLeads(prevLeads => 
          prevLeads.filter(lead => lead.place_id !== discoveredLead.place_id)
        );

        toast({
          title: "Lead uspješno dodan",
          description: `${discoveredLead.name} je dodan u Lead Hunter.`,
        });
      } else {
        toast({
          title: "Greška pri dodavanju",
          description: "Dogodila se greška pri dodavanju lead-a. Molimo pokušajte ponovno.",
          variant: "destructive",
        });
      }
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
