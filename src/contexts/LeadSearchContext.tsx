import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';
import { performLeadSearch, performApifyLeadSearch, performFirecrawlLeadSearch } from '@/components/lead-discovery/SearchOperations';
import { useToast } from '@/hooks/use-toast';

export type SearchMethod = 'google' | 'apify' | 'firecrawl';

interface SearchParams {
  searchQuery: string;
  location: string;
  country: string;
  industry: string;
  searchMethod: SearchMethod;
  apiKey?: string;
  getPlaceDetails?: (placeId: string, apiKey: string) => Promise<any>;
}

interface LeadSearchContextValue {
  isSearching: boolean;
  discoveredLeads: AnalyzedLead[];
  setDiscoveredLeads: React.Dispatch<React.SetStateAction<AnalyzedLead[]>>;
  startBackgroundSearch: (params: SearchParams) => Promise<void>;
  searchLabel: string;
}

const LeadSearchContext = createContext<LeadSearchContextValue | undefined>(undefined);

const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'default') {
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }
  return Notification.permission;
};

const sendBrowserNotification = (title: string, body: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch (e) {
      console.warn('Notification failed', e);
    }
  }
};

export const LeadSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<AnalyzedLead[]>(() => {
    try {
      const raw = localStorage.getItem('discoveredLeads');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [searchLabel, setSearchLabel] = useState('');
  const activeSearchRef = useRef<Promise<void> | null>(null);

  const updateLeads = useCallback<React.Dispatch<React.SetStateAction<AnalyzedLead[]>>>((value) => {
    setDiscoveredLeads((prev) => {
      const next = typeof value === 'function' ? (value as (p: AnalyzedLead[]) => AnalyzedLead[])(prev) : value;
      try {
        localStorage.setItem('discoveredLeads', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist leads', e);
      }
      return next;
    });
  }, []);

  const startBackgroundSearch = useCallback(async (params: SearchParams) => {
    if (activeSearchRef.current) {
      toast({
        title: 'Pretraga je već u tijeku',
        description: 'Pričekajte da trenutna pretraga završi.',
      });
      return;
    }

    await requestNotificationPermission();

    const label = `${params.searchQuery || params.industry} • ${params.location}`;
    setSearchLabel(label);
    setIsSearching(true);

    const searchLocation = params.country && params.country !== 'all' && params.country !== params.location
      ? `${params.location}, ${params.country}`
      : params.location;

    const promise = (async () => {
      try {
        let leads: AnalyzedLead[] = [];
        if (params.searchMethod === 'apify') {
          leads = await performApifyLeadSearch(params.searchQuery, searchLocation, params.industry, 20) as AnalyzedLead[];
        } else if (params.searchMethod === 'firecrawl') {
          leads = await performFirecrawlLeadSearch(params.searchQuery, searchLocation, params.country, params.industry) as AnalyzedLead[];
        } else {
          if (!params.apiKey || !params.getPlaceDetails) {
            throw new Error('Google Maps API ključ je potreban.');
          }
          leads = await performLeadSearch(params.searchQuery, searchLocation, params.industry, params.apiKey, params.getPlaceDetails) as AnalyzedLead[];
        }

        updateLeads(leads);

        const emailsFound = leads.filter(l => l.email).length;
        const message = `Pronađeno ${leads.length} leadova. ${emailsFound} s email adresom.`;

        toast({
          title: '✅ Pretraga završena',
          description: `${label}: ${message}`,
        });
        sendBrowserNotification('Pretraga leadova završena', `${label}\n${message}`);
      } catch (error) {
        console.error('Background search error:', error);
        const errMsg = error instanceof Error ? error.message : 'Nepoznata greška';
        toast({
          title: '❌ Greška u pretrazi',
          description: errMsg,
          variant: 'destructive',
        });
        sendBrowserNotification('Pretraga leadova nije uspjela', errMsg);
      } finally {
        setIsSearching(false);
        setSearchLabel('');
        activeSearchRef.current = null;
      }
    })();

    activeSearchRef.current = promise;
    await promise;
  }, [toast, updateLeads]);

  return (
    <LeadSearchContext.Provider
      value={{
        isSearching,
        discoveredLeads,
        setDiscoveredLeads: updateLeads,
        startBackgroundSearch,
        searchLabel,
      }}
    >
      {children}
    </LeadSearchContext.Provider>
  );
};

export const useLeadSearch = () => {
  const ctx = useContext(LeadSearchContext);
  if (!ctx) throw new Error('useLeadSearch must be used within LeadSearchProvider');
  return ctx;
};
