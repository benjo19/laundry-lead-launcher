
import { industries, DiscoveredLead } from './SearchForm';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';
import { scrapeEmailFromWebsite } from '@/utils/emailScraper';

export const performLeadSearch = async (
  searchQuery: string,
  location: string,
  industry: string,
  apiKey: string,
  getPlaceDetails: (placeId: string, apiKey: string) => Promise<any>
) => {
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
    return [];
  }
  
  // Fetch detailed information for each place
  console.log('Fetching detailed information and emails for places...');
  const detailedLeads = [];
  
  for (const place of data.results.slice(0, 10)) {
    const details = await getPlaceDetails(place.place_id, apiKey);
    
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
      
      // Only try to scrape email if website exists
      if (enhancedLead.website) {
        console.log(`Attempting to scrape email from website: ${enhancedLead.website}`);
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
  
  return detailedLeads;
};
