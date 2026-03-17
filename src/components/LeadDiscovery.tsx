
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
import WebSearchTab from './lead-discovery/WebSearchTab';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';

interface LeadDiscoveryProps {
  onAddLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => Promise<boolean>;
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadDiscovery = ({ onAddLead, onNavigateToEmailGenerator }: LeadDiscoveryProps) => {
  const { user } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    location,
    setLocation,
    country,
    setCountry,
    industry,
    setIndustry,
    searchMethod,
    setSearchMethod,
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
  const {
    profiles,
    selectedProfile,
    selectedProfileId,
    setSelectedProfileId,
    isLoading: isLoadingProfiles
  } = useBusinessProfile();

  const { addDiscoveredLead } = useLeadAddition({
    onAddLead,
    setDiscoveredLeads,
    industry,
    selectedBusinessProfile: selectedProfile
  });

  const { searchLeads } = useLeadDiscoverySearch({
    searchQuery,
    location,
    country,
    industry,
    searchMethod,
    tempApiKey,
    savedGoogleMapsApiKey,
    saveGoogleMapsApiKey,
    getPlaceDetails,
    setIsSearching,
    setDiscoveredLeads,
    toast
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <LeadDiscoveryHeader 
        user={user}
        savedGoogleMapsApiKey={savedGoogleMapsApiKey}
      />

      <SearchForm
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        location={location}
        setLocation={setLocation}
        country={country}
        setCountry={setCountry}
        industry={industry}
        setIndustry={setIndustry}
        apiKey={tempApiKey}
        setApiKey={setTempApiKey}
        searchMethod={searchMethod}
        setSearchMethod={setSearchMethod}
        isSearching={isSearching}
        isAnalyzing={isAnalyzing}
        discoveredLeads={discoveredLeads}
        onSearchLeads={searchLeads}
        onAnalyzeWithAI={analyzeWithAI}
        showApiKeyInput={!savedGoogleMapsApiKey}
        businessProfiles={profiles}
        selectedBusinessProfileId={selectedProfileId}
        setSelectedBusinessProfileId={setSelectedProfileId}
        isLoadingBusinessProfiles={isLoadingProfiles}
      />

      <LeadList 
        discoveredLeads={discoveredLeads} 
        onAddLead={addDiscoveredLead}
        onNavigateToEmailGenerator={onNavigateToEmailGenerator}
      />

      {discoveredLeads.length === 0 && !isSearching && <EmptyState />}

      {/* Web Search Tab */}
      <WebSearchTab onAddLead={onAddLead} />
    </div>
  );
};

export default LeadDiscovery;
