
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
  console.log('Raw search parameters:', { 
    searchQuery: `"${searchQuery}"`, 
    location: `"${location}"`, 
    industry: `"${industry}"`, 
    apiKey: apiKey ? 'SET' : 'NOT SET' 
  });
  
  const selectedIndustry = industries.find(ind => ind.value === industry);
  console.log('Selected industry object:', selectedIndustry);
  
  const baseQuery = selectedIndustry?.query || 'business';
  console.log('Base query from industry:', baseQuery);
  
  // Build more specific query
  let finalQuery = baseQuery;
  if (searchQuery && searchQuery.trim()) {
    finalQuery = `${searchQuery} ${baseQuery}`;
  }
  
  const fullSearchQuery = `${finalQuery} in ${location}`;
  console.log('=== FINAL SEARCH QUERY ===:', `"${fullSearchQuery}"`);
  console.log('Query length:', fullSearchQuery.length);
  console.log('Encoded query:', encodeURIComponent(fullSearchQuery));
  
  try {
    // First try direct Google Maps API call
    const directUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fullSearchQuery)}&key=${apiKey}`;
    console.log('=== API URL ===');
    console.log('Full API URL:', directUrl);
    console.log('URL length:', directUrl.length);
    
    let response;
    let apiMethod = 'direct';
    
    try {
      console.log('Attempting DIRECT API call...');
      response = await fetch(directUrl);
      console.log('Direct API response status:', response.status);
      console.log('Direct API response headers:', Object.fromEntries(response.headers.entries()));
    } catch (corsError) {
      console.log('Direct API failed with CORS, trying proxy...', corsError);
      
      // Fallback to CORS proxy
      apiMethod = 'proxy';
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const proxiedUrl = proxyUrl + encodeURIComponent(directUrl);
      console.log('Trying proxy URL:', proxiedUrl);
      
      response = await fetch(proxiedUrl);
      console.log('Proxy API response status:', response.status);
    }
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('=== API RESPONSE ANALYSIS ===');
    console.log('API method used:', apiMethod);
    console.log('API Response status:', data.status);
    console.log('API Response results count:', data.results ? data.results.length : 0);
    console.log('API Response error_message:', data.error_message);
    console.log('First result preview:', data.results?.[0] ? {
      name: data.results[0].name,
      place_id: data.results[0].place_id,
      types: data.results[0].types,
      formatted_address: data.results[0].formatted_address
    } : 'No results');
    
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
    
    console.log('=== PROCESSING RESULTS ===');
    console.log('Processing', data.results.length, 'places...');
    console.log('All place IDs found:', data.results.map(r => r.place_id));
    
    // Process results with more detailed logging
    const detailedLeads = [];
    const maxResults = Math.min(data.results.length, 10);
    
    for (let i = 0; i < maxResults; i++) {
      const place = data.results[i];
      console.log(`\n--- Processing place ${i + 1}/${maxResults} ---`);
      console.log('Place name:', place.name);
      console.log('Place ID:', place.place_id);
      console.log('Place types:', place.types);
      console.log('Place address:', place.formatted_address);
      
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
        
        console.log(`Enhanced lead created:`, {
          name: enhancedLead.name,
          place_id: enhancedLead.place_id,
          hasWebsite: !!enhancedLead.website,
          hasPhone: !!enhancedLead.phone
        });
        
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
    console.log('Final lead names:', detailedLeads.map(lead => lead.name));
    console.log('Final place IDs:', detailedLeads.map(lead => lead.place_id));
    
    return detailedLeads;
    
  } catch (error) {
    console.error('=== SEARCH ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw error;
  }
};
