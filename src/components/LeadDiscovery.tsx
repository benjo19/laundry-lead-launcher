
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types';
import SearchForm, { industries, DiscoveredLead } from './lead-discovery/SearchForm';
import LeadList from './lead-discovery/LeadList';
import EmptyState from './lead-discovery/EmptyState';

interface LeadDiscoveryProps {
  onAddLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => void;
}

const LeadDiscovery = ({ onAddLead }: LeadDiscoveryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('laundry');
  const [isSearching, setIsSearching] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>([]);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const searchLeads = async () => {
    if (!apiKey) {
      toast({
        title: "API ključ potreban",
        description: "Molimo unesite Google Maps API ključ.",
        variant: "destructive",
      });
      return;
    }

    if (!location) {
      toast({
        title: "Lokacija potrebna",
        description: "Molimo unesite lokaciju za pretraživanje.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const selectedIndustry = industries.find(ind => ind.value === industry);
      const query = searchQuery || selectedIndustry?.query || 'business';
      
      // Using a CORS proxy to avoid CORS issues with Google Maps API
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const targetUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' in ' + location)}&key=${apiKey}`;
      
      console.log('Searching for:', query + ' in ' + location);
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (!response.ok) {
        throw new Error('Greška pri dohvaćanju podataka iz Google Maps API');
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.status === 'REQUEST_DENIED') {
        throw new Error('API ključ nije valjan ili nema dozvole za Places API');
      }
      
      if (data.status !== 'OK') {
        throw new Error(data.error_message || `API greška: ${data.status}`);
      }
      
      if (!data.results || data.results.length === 0) {
        toast({
          title: "Nema rezultata",
          description: "Nisu pronađeni leadovi za zadane parametre.",
        });
        setDiscoveredLeads([]);
        return;
      }
      
      setDiscoveredLeads(data.results.slice(0, 10)); // Limit to 10 results
      
      toast({
        title: "Pretraživanje završeno",
        description: `Pronađeno ${data.results.length} potencijalnih leadova.`,
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

  const addDiscoveredLead = (discoveredLead: DiscoveredLead) => {
    const newLead: Omit<Lead, 'id' | 'dateAdded'> = {
      company: discoveredLead.name,
      location: discoveredLead.address,
      employees: '10-50', // Default estimate
      phone: discoveredLead.phone || '',
      email: '', // Will need to be filled manually
      status: 'Nova',
      potential: 'Srednji',
      notes: `Pronađeno putem Google Maps - Rating: ${discoveredLead.rating || 'N/A'}, Tipovi: ${discoveredLead.types.join(', ')}`
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

  const analyzeWithAI = async (leads: DiscoveredLead[]) => {
    toast({
      title: "AI analiza",
      description: "AI funkcionalnost će biti dodana u budućoj verziji.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Lead Discovery</h2>
          <p className="text-slate-600">Pronađite nove leadove pomoću Google Maps i AI analize</p>
        </div>
      </div>

      <SearchForm
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        location={location}
        setLocation={setLocation}
        industry={industry}
        setIndustry={setIndustry}
        apiKey={apiKey}
        setApiKey={setApiKey}
        isSearching={isSearching}
        discoveredLeads={discoveredLeads}
        onSearchLeads={searchLeads}
        onAnalyzeWithAI={analyzeWithAI}
      />

      <LeadList 
        discoveredLeads={discoveredLeads} 
        onAddLead={addDiscoveredLead} 
      />

      {discoveredLeads.length === 0 && !isSearching && <EmptyState />}
    </div>
  );
};

export default LeadDiscovery;
