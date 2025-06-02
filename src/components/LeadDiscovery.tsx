
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types';
import SearchForm, { industries, DiscoveredLead } from './lead-discovery/SearchForm';
import LeadList from './lead-discovery/LeadList';
import EmptyState from './lead-discovery/EmptyState';
import { scrapeEmailFromWebsite } from '@/utils/emailScraper';

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

  const getPlaceDetails = async (placeId: string) => {
    try {
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry,business_status,opening_hours&key=${apiKey}`;
      
      const response = await fetch(proxyUrl + encodeURIComponent(detailsUrl));
      
      if (!response.ok) {
        throw new Error('Greška pri dohvaćanju detalja');
      }
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.result;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  };

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
      
      // Fetch detailed information for each place
      console.log('Fetching detailed information and emails for places...');
      const detailedLeads = [];
      
      for (const place of data.results.slice(0, 10)) {
        const details = await getPlaceDetails(place.place_id);
        
        if (details) {
          const enhancedLead: DiscoveredLead = {
            name: details.name || place.name,
            address: details.formatted_address || place.formatted_address,
            phone: details.formatted_phone_number || '',
            website: details.website || '',
            rating: details.rating || place.rating,
            types: details.types || place.types,
            place_id: place.place_id,
            geometry: place.geometry,
            business_status: details.business_status || place.business_status,
            user_ratings_total: details.user_ratings_total || place.user_ratings_total
          };
          
          // Try to scrape email from website if available
          if (enhancedLead.website) {
            console.log(`Attempting to scrape email from: ${enhancedLead.website}`);
            const scrapedEmail = await scrapeEmailFromWebsite(enhancedLead.website);
            if (scrapedEmail) {
              enhancedLead.email = scrapedEmail;
              enhancedLead.emailScraped = true;
            }
          }
          
          detailedLeads.push(enhancedLead);
        } else {
          // Fallback to basic info if details fetch fails
          const basicLead: DiscoveredLead = {
            name: place.name,
            address: place.formatted_address,
            phone: '',
            website: '',
            rating: place.rating,
            types: place.types,
            place_id: place.place_id,
            geometry: place.geometry,
            business_status: place.business_status,
            user_ratings_total: place.user_ratings_total
          };
          
          detailedLeads.push(basicLead);
        }
      }
      
      setDiscoveredLeads(detailedLeads);
      
      const emailsFound = detailedLeads.filter(lead => lead.email).length;
      
      toast({
        title: "Pretraživanje završeno",
        description: `Pronađeno ${detailedLeads.length} leadova s kontakt informacijama. ${emailsFound} email adresa automatski pronađeno.`,
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
      email: discoveredLead.email || '', // Now includes scraped emails
      status: 'Nova',
      potential: 'Srednji',
      notes: `Pronađeno putem Google Maps - Rating: ${discoveredLead.rating || 'N/A'}, Tipovi: ${discoveredLead.types.join(', ')}${discoveredLead.website ? `, Website: ${discoveredLead.website}` : ''}${discoveredLead.emailScraped ? ', Email automatski pronađen' : ''}`
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
