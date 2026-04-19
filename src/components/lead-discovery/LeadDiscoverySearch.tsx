import { useLeadSearch } from '@/contexts/LeadSearchContext';

interface LeadDiscoverySearchProps {
  searchQuery: string;
  location: string;
  country: string;
  industry: string;
  searchMethod: 'google' | 'apify' | 'firecrawl';
  tempApiKey: string;
  savedGoogleMapsApiKey: string;
  saveGoogleMapsApiKey: (key: string) => Promise<void>;
  getPlaceDetails: (placeId: string, apiKey: string) => Promise<any>;
  setIsSearching: (searching: boolean) => void;
  setDiscoveredLeads: (leads: any) => void;
  toast: any;
}

export const useLeadDiscoverySearch = ({
  searchQuery,
  location,
  country,
  industry,
  searchMethod,
  tempApiKey,
  savedGoogleMapsApiKey,
  saveGoogleMapsApiKey,
  getPlaceDetails,
  toast,
}: LeadDiscoverySearchProps) => {
  const { startBackgroundSearch, isSearching } = useLeadSearch();

  const searchLeads = async () => {
    if (isSearching) {
      toast({
        title: 'Pretraga u tijeku',
        description: 'Već postoji aktivna pretraga u pozadini.',
      });
      return;
    }

    if (searchMethod === 'google') {
      const currentApiKey = tempApiKey || savedGoogleMapsApiKey;
      if (!currentApiKey) {
        toast({
          title: 'API ključ potreban',
          description: 'Molimo unesite Google Maps API ključ ili ga postavite u Settings.',
          variant: 'destructive',
        });
        return;
      }
      if (tempApiKey && tempApiKey !== savedGoogleMapsApiKey) {
        await saveGoogleMapsApiKey(tempApiKey);
      }
    }

    if (!location) {
      toast({
        title: 'Lokacija potrebna',
        description: 'Molimo unesite lokaciju za pretraživanje.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '🔍 Pretraga pokrenuta u pozadini',
      description: 'Možete slobodno otići na drugu stranicu — javit ćemo vam kad završi.',
    });

    // Fire-and-forget: search continues even if component unmounts
    void startBackgroundSearch({
      searchQuery,
      location,
      country,
      industry,
      searchMethod,
      apiKey: tempApiKey || savedGoogleMapsApiKey,
      getPlaceDetails,
    });
  };

  return { searchLeads };
};
