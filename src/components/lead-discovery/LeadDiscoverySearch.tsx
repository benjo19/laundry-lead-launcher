
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';
import { performLeadSearch } from './SearchOperations';

interface LeadDiscoverySearchProps {
  searchQuery: string;
  location: string;
  industry: string;
  tempApiKey: string;
  savedGoogleMapsApiKey: string;
  saveGoogleMapsApiKey: (key: string) => Promise<void>;
  getPlaceDetails: (placeId: string, apiKey: string) => Promise<any>;
  setIsSearching: (searching: boolean) => void;
  setDiscoveredLeads: (leads: AnalyzedLead[]) => void;
  toast: any;
}

export const useLeadDiscoverySearch = ({
  searchQuery,
  location,
  industry,
  tempApiKey,
  savedGoogleMapsApiKey,
  saveGoogleMapsApiKey,
  getPlaceDetails,
  setIsSearching,
  setDiscoveredLeads,
  toast
}: LeadDiscoverySearchProps) => {
  const searchLeads = async () => {
    const currentApiKey = tempApiKey || savedGoogleMapsApiKey;
    
    if (!currentApiKey) {
      toast({
        title: "API ključ potreban",
        description: "Molimo unesite Google Maps API ključ ili ga postavite u Settings.",
        variant: "destructive",
      });
      return;
    }

    // Save the API key if it's entered manually and different from saved one
    if (tempApiKey && tempApiKey !== savedGoogleMapsApiKey) {
      await saveGoogleMapsApiKey(tempApiKey);
    }

    if (!location) {
      toast({
        title: "Lokacija potrebna",
        description: "Molimo unesite lokaciju za pretraživanje.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const detailedLeads = await performLeadSearch(
        searchQuery,
        location,
        industry,
        currentApiKey,
        getPlaceDetails
      );
      
      setDiscoveredLeads(detailedLeads);
      
      const emailsFound = detailedLeads.filter(lead => lead.email && lead.emailScraped).length;
      const leadsWithoutEmail = detailedLeads.filter(lead => !lead.email).length;
      
      toast({
        title: "Pretraživanje završeno",
        description: `Pronađeno ${detailedLeads.length} leadova. ${emailsFound} email adresa pronađeno na web stranicama. ${leadsWithoutEmail} leadova nema dostupnu email adresu.`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Greška",
        description: error instanceof Error ? error.message : "Dogodila se greška pri pretraživanju leadova.",
        variant: "destructive",
      });
      setDiscoveredLeads([]);
    } finally {
      setIsSearching(false);
    }
  };

  return { searchLeads };
};
