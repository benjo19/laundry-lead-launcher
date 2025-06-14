
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
  console.log('=== STARTING LEAD SEARCH ===');
  console.log('Search parameters:', { searchQuery, location, industry, apiKey: apiKey ? 'SET' : 'NOT SET' });
  
  const selectedIndustry = industries.find(ind => ind.value === industry);
  const baseQuery = selectedIndustry?.query || 'business';
  
  // Build more specific query
  let finalQuery = baseQuery;
  if (searchQuery && searchQuery.trim()) {
    finalQuery = `${searchQuery} ${baseQuery}`;
  }
  
  const fullSearchQuery = `${finalQuery} in ${location}`;
  console.log('Final search query:', fullSearchQuery);
  
  try {
    // First try direct Google Maps API call
    const directUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fullSearchQuery)}&key=${apiKey}`;
    console.log('Attempting direct API call to:', directUrl);
    
    let response;
    try {
      response = await fetch(directUrl);
      console.log('Direct API response status:', response.status);
    } catch (corsError) {
      console.log('Direct API failed with CORS, trying proxy...', corsError);
      
      // Fallback to CORS proxy
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const proxiedUrl = proxyUrl + encodeURIComponent(directUrl);
      console.log('Trying proxy URL:', proxiedUrl);
      
      response = await fetch(proxiedUrl);
      console.log('Proxy API response status:', response.status);
    }
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Response status:', data.status);
    console.log('API Response results count:', data.results ? data.results.length : 0);
    console.log('Full API Response:', data);
    
    if (data.status === 'REQUEST_DENIED') {
      console.error('API Request denied:', data.error_message);
      throw new Error('API ključ nije valjan ili nema dozvole za Places API');
    }
    
    if (data.status === 'ZERO_RESULTS') {
      console.log('No results found for query:', fullSearchQuery);
      return [];
    }
    
    if (data.status !== 'OK') {
      console.error('API Error:', data.status, data.error_message);
      throw new Error(data.error_message || `API greška: ${data.status}`);
    }
    
    if (!data.results || data.results.length === 0) {
      console.log('No results in response');
      return [];
    }
    
    console.log('Processing', data.results.length, 'places...');
    
    // Process results with more detailed logging
    const detailedLeads = [];
    const maxResults = Math.min(data.results.length, 10);
    
    for (let i = 0; i < maxResults; i++) {
      const place = data.results[i];
      console.log(`Processing place ${i + 1}/${maxResults}:`, place.name);
      
      try {
        const details = await getPlaceDetails(place.place_id, apiKey);
        console.log(`Details for ${place.name}:`, details ? 'SUCCESS' : 'FAILED');
        
        let enhancedLead: DiscoveredLead;
        
        if (details) {
          enhancedLead = {
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
        } else {
          // Fallback to basic info if details fetch fails
          enhancedLead = {
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
        }
        
        // Only try to scrape email if website exists
        if (enhancedLead.website) {
          console.log(`Attempting to scrape email from: ${enhancedLead.website}`);
          try {
            const scrapedEmail = await scrapeEmailFromWebsite(enhancedLead.website);
            if (scrapedEmail) {
              enhancedLead.email = scrapedEmail;
              enhancedLead.emailScraped = true;
              console.log(`Email found for ${enhancedLead.name}: ${scrapedEmail}`);
            } else {
              console.log(`No email found for ${enhancedLead.name}`);
            }
          } catch (emailError) {
            console.error(`Email scraping failed for ${enhancedLead.name}:`, emailError);
          }
        }
        
        detailedLeads.push(enhancedLead);
        console.log(`Successfully processed ${enhancedLead.name}`);
        
      } catch (placeError) {
        console.error(`Error processing place ${place.name}:`, placeError);
        // Still add basic info even if details fail
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
    
    console.log('=== SEARCH COMPLETED ===');
    console.log('Total leads processed:', detailedLeads.length);
    console.log('Leads with emails:', detailedLeads.filter(lead => lead.email).length);
    
    return detailedLeads;
    
  } catch (error) {
    console.error('=== SEARCH ERROR ===');
    console.error('Error details:', error);
    throw error;
  }
};
