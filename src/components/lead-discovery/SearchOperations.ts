
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
  console.log('=== STARTING REAL GOOGLE MAPS SEARCH ===');
  console.log('Search parameters:', { 
    searchQuery: `"${searchQuery}"`, 
    location: `"${location}"`, 
    industry: `"${industry}"`, 
    apiKey: apiKey ? 'PROVIDED' : 'MISSING' 
  });

  if (!apiKey) {
    throw new Error('Google Maps API ključ je potreban za pretraživanje');
  }
  
  const selectedIndustry = industries.find(ind => ind.value === industry);
  console.log('Selected industry:', selectedIndustry);
  
  // Build the search query properly
  let finalQuery = '';
  if (searchQuery && searchQuery.trim()) {
    finalQuery = searchQuery.trim();
  } else if (selectedIndustry) {
    finalQuery = selectedIndustry.query;
  } else {
    finalQuery = 'business';
  }
  
  // Add location to the query
  const fullSearchQuery = `${finalQuery} in ${location}`;
  console.log('=== FINAL GOOGLE MAPS QUERY ===:', `"${fullSearchQuery}"`);
  
  try {
    // Use Google Maps Places Text Search API
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fullSearchQuery)}&key=${apiKey}`;
    console.log('Google Maps API URL:', textSearchUrl);
    
    let response;
    let method = 'direct';
    
    try {
      console.log('Attempting direct Google Maps API call...');
      response = await fetch(textSearchUrl);
      console.log('Direct API response status:', response.status);
    } catch (corsError) {
      console.log('Direct API failed, trying CORS proxy...');
      method = 'proxy';
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const proxiedUrl = proxyUrl + encodeURIComponent(textSearchUrl);
      response = await fetch(proxiedUrl);
      console.log('Proxy API response status:', response.status);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Google Maps API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('=== GOOGLE MAPS API RESPONSE ===');
    console.log('Status:', data.status);
    console.log('Results count:', data.results ? data.results.length : 0);
    console.log('Error message:', data.error_message || 'none');
    
    if (data.status === 'REQUEST_DENIED') {
      throw new Error(`Google Maps API zahtjev odbačen: ${data.error_message}`);
    }
    
    if (data.status === 'INVALID_REQUEST') {
      throw new Error(`Nevažeći zahtjev: ${data.error_message}`);
    }
    
    if (data.status === 'ZERO_RESULTS') {
      console.log('No results found for query:', fullSearchQuery);
      return [];
    }
    
    if (data.status !== 'OK') {
      throw new Error(`Google Maps API greška: ${data.status} - ${data.error_message || 'Nepoznata greška'}`);
    }
    
    if (!data.results || data.results.length === 0) {
      console.log('No results returned from Google Maps');
      return [];
    }
    
    console.log('=== PROCESSING GOOGLE MAPS RESULTS ===');
    console.log('Found places:', data.results.map(r => ({ name: r.name, place_id: r.place_id })));
    
    // Process real results from Google Maps
    const realLeads: DiscoveredLead[] = [];
    const maxResults = Math.min(data.results.length, 10);
    
    for (let i = 0; i < maxResults; i++) {
      const place = data.results[i];
      console.log(`\n--- Processing place ${i + 1}: ${place.name} ---`);
      
      try {
        // Get detailed information for each place
        const details = await getPlaceDetails(place.place_id, apiKey);
        
        const lead: DiscoveredLead = {
          name: place.name,
          address: place.formatted_address || '',
          phone: details?.formatted_phone_number || '',
          website: details?.website || '',
          rating: place.rating || details?.rating,
          types: place.types || [],
          place_id: place.place_id,
          geometry: place.geometry,
          business_status: place.business_status,
          user_ratings_total: place.user_ratings_total
        };
        
        // Try to scrape email if website exists
        if (lead.website) {
          console.log(`Scraping email from: ${lead.website}`);
          try {
            const email = await scrapeEmailFromWebsite(lead.website);
            if (email) {
              lead.email = email;
              lead.emailScraped = true;
              console.log(`Email found: ${email}`);
            }
          } catch (emailError) {
            console.error(`Email scraping failed:`, emailError);
          }
        }
        
        realLeads.push(lead);
        console.log(`Successfully processed: ${lead.name}`);
        
      } catch (placeError) {
        console.error(`Error processing place ${place.name}:`, placeError);
        // Add basic info even if details fail
        realLeads.push({
          name: place.name,
          address: place.formatted_address || '',
          phone: '',
          website: '',
          rating: place.rating,
          types: place.types || [],
          place_id: place.place_id,
          geometry: place.geometry,
          business_status: place.business_status,
          user_ratings_total: place.user_ratings_total
        });
      }
    }
    
    console.log('=== SEARCH COMPLETED ===');
    console.log('Total real leads found:', realLeads.length);
    console.log('Leads with emails:', realLeads.filter(lead => lead.email).length);
    console.log('Final results:', realLeads.map(lead => ({ name: lead.name, hasEmail: !!lead.email })));
    
    return realLeads;
    
  } catch (error) {
    console.error('=== GOOGLE MAPS SEARCH ERROR ===');
    console.error('Error:', error);
    throw error;
  }
};
