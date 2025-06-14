
import React from 'react';
import { Lead } from '@/types';
import SearchForm, { DiscoveredLead } from './lead-discovery/SearchForm';
import LeadList from './lead-discovery/LeadList';
import EmptyState from './lead-discovery/EmptyState';
import StatusIndicators from './lead-discovery/StatusIndicators';
import { useLeadDiscovery } from '@/hooks/useLeadDiscovery';
import { performLeadSearch } from './lead-discovery/SearchOperations';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';

interface LeadDiscoveryProps {
  onAddLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => void;
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadDiscovery = ({ onAddLead, onNavigateToEmailGenerator }: LeadDiscoveryProps) => {
  const {
    searchQuery,
    setSearchQuery,
    location,
    setLocation,
    industry,
    setIndustry,
    isSearching,
    setIsSearching,
    isAnalyzing,
    discoveredLeads,
    setDiscoveredLeads,
    tempApiKey,
    setTempApiKey,
    savedGoogleMapsApiKey,
    saveGoogleMapsApiKey,
    getPlaceDetails,
    analyzeWithAI,
    toast,
    isAIConfigured
  } = useLeadDiscovery();

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

  const addDiscoveredLead = (discoveredLead: AnalyzedLead) => {
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

    onAddLead(newLead);
    
    // Remove from discovered leads
    setDiscoveredLeads(prevLeads => 
      prevLeads.filter(lead => lead.place_id !== discoveredLead.place_id)
    );

    toast({
      title: "Lead dodan",
      description: `${discoveredLead.name} je dodan u Lead Hunter.`,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Lead Discovery</h2>
          <p className="text-slate-600 text-sm sm:text-base">Pronađite nove leadove pomoću Google Maps i AI analize - email adrese se traže samo na web stranicama</p>
          <StatusIndicators 
            savedGoogleMapsApiKey={savedGoogleMapsApiKey}
            isAIConfigured={isAIConfigured()}
          />
        </div>
      </div>

      <SearchForm
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        location={location}
        setLocation={setLocation}
        industry={industry}
        setIndustry={setIndustry}
        apiKey={tempApiKey}
        setApiKey={setTempApiKey}
        isSearching={isSearching}
        isAnalyzing={isAnalyzing}
        discoveredLeads={discoveredLeads}
        onSearchLeads={searchLeads}
        onAnalyzeWithAI={analyzeWithAI}
        showApiKeyInput={!savedGoogleMapsApiKey}
      />

      <LeadList 
        discoveredLeads={discoveredLeads} 
        onAddLead={addDiscoveredLead}
        onNavigateToEmailGenerator={onNavigateToEmailGenerator}
      />

      {discoveredLeads.length === 0 && !isSearching && <EmptyState />}
    </div>
  );
};

export default LeadDiscovery;
