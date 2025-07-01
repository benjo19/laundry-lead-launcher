
import React from 'react';
import { Lead } from '@/types';
import SearchForm from './lead-discovery/SearchForm';
import LeadList from './lead-discovery/LeadList';
import EmptyState from './lead-discovery/EmptyState';
import LeadDiscoveryHeader from './lead-discovery/LeadDiscoveryHeader';
import { useLeadDiscovery } from '@/hooks/useLeadDiscovery';
import { useLeadAddition } from '@/hooks/useLeadAddition';
import { useLeadDiscoverySearch } from './lead-discovery/LeadDiscoverySearch';
import { useAuth } from '@/hooks/useAuth';

interface LeadDiscoveryProps {
  onAddLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => void;
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadDiscovery = ({ onAddLead, onNavigateToEmailGenerator }: LeadDiscoveryProps) => {
  const { user } = useAuth();
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

  const { addDiscoveredLead } = useLeadAddition({ onAddLead, setDiscoveredLeads });

  const { searchLeads } = useLeadDiscoverySearch({
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
    toast
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <LeadDiscoveryHeader 
        user={user}
        savedGoogleMapsApiKey={savedGoogleMapsApiKey}
        isAIConfigured={Boolean(isAIConfigured())}
      />

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
