
import { industries, DiscoveredLead } from './SearchForm';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';
import { scrapeEmailFromWebsite, enhancedEmailDiscovery } from '@/utils/emailScraper';

// Local helpers for domain matching
const stripWww = (host: string) => host.replace(/^www\./i, '');
const twoPartTLDs = new Set(['co.uk','com.au','com.br','com.hr','com.tr','com.cn','com.mx','com.ar','com.pl','com.sg','com.my']);
const getDomainRoot = (host: string) => {
  const h = stripWww(host.toLowerCase());
  const parts = h.split('.');
  if (parts.length <= 2) return h;
  const last2 = parts.slice(-2).join('.');
  const last3 = parts.slice(-3).join('.');
  return twoPartTLDs.has(last2) ? last3 : last2;
};
const isFreeEmailDomain = (domain: string) => /(gmail|yahoo|hotmail|outlook|aol|icloud|proton|yandex|zoho|gmx|live|msn)\./i.test(domain);

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
    apiKey: apiKey ? `KEY PROVIDED (${apiKey.substring(0, 10)}...)` : 'MISSING API KEY' 
  });

  // CRITICAL CHECK: Verify API key is present
  if (!apiKey || apiKey.trim() === '') {
    console.error('❌ CRITICAL ERROR: No API key provided!');
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
  console.log('🔍 FINAL GOOGLE MAPS QUERY:', `"${fullSearchQuery}"`);
  
  try {
    // Use Google Maps Places Text Search API
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fullSearchQuery)}&key=${apiKey}`;
    console.log('🌐 Google Maps API URL:', textSearchUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    
    let response;
    let method = 'direct';
    
    console.log('🚀 Attempting direct Google Maps API call...');
    try {
      response = await fetch(textSearchUrl);
      console.log('✅ Direct API response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    } catch (corsError) {
      console.log('❌ Direct API failed with CORS error:', corsError);
      console.log('🔄 Trying CORS proxy...');
      method = 'proxy';
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const proxiedUrl = proxyUrl + encodeURIComponent(textSearchUrl);
      console.log('🌐 Proxy URL:', proxiedUrl.replace(apiKey, 'API_KEY_HIDDEN'));
      response = await fetch(proxiedUrl);
      console.log('✅ Proxy API response status:', response.status);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Google Maps API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('=== GOOGLE MAPS API RESPONSE ===');
    console.log('📈 Status:', data.status);
    console.log('📊 Results count:', data.results ? data.results.length : 0);
    console.log('⚠️ Error message:', data.error_message || 'none');
    console.log('🏢 First 3 results preview:', data.results ? data.results.slice(0, 3).map(r => ({ 
      name: r.name, 
      address: r.formatted_address,
      place_id: r.place_id 
    })) : 'no results');
    
    if (data.status === 'REQUEST_DENIED') {
      console.error('❌ REQUEST_DENIED:', data.error_message);
      throw new Error(`Google Maps API zahtjev odbačen: ${data.error_message}`);
    }
    
    if (data.status === 'INVALID_REQUEST') {
      console.error('❌ INVALID_REQUEST:', data.error_message);
      throw new Error(`Nevažeći zahtjev: ${data.error_message}`);
    }
    
    if (data.status === 'ZERO_RESULTS') {
      console.log('⚠️ No results found for query:', fullSearchQuery);
      return [];
    }
    
    if (data.status !== 'OK') {
      console.error('❌ API Status not OK:', data.status, data.error_message);
      throw new Error(`Google Maps API greška: ${data.status} - ${data.error_message || 'Nepoznata greška'}`);
    }
    
    if (!data.results || data.results.length === 0) {
      console.log('⚠️ No results returned from Google Maps');
      return [];
    }
    
    console.log('=== PROCESSING GOOGLE MAPS RESULTS ===');
    console.log('🏢 Found places:', data.results.map(r => ({ 
      name: r.name, 
      place_id: r.place_id,
      address: r.formatted_address
    })));
    
    // Process real results from Google Maps
    const realLeads: DiscoveredLead[] = [];
    const maxResults = Math.min(data.results.length, 10);
    
    for (let i = 0; i < maxResults; i++) {
      const place = data.results[i];
      console.log(`\n--- Processing place ${i + 1}: ${place.name} ---`);
      console.log('Place data:', {
        name: place.name,
        address: place.formatted_address,
        place_id: place.place_id,
        rating: place.rating,
        types: place.types
      });
      
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
        
        // Try to scrape email and social profiles if website exists
        let emailSource = '';
        let socialProfiles = {};
        
        if (lead.website) {
          console.log(`📧 Scraping email from: ${lead.website}`);
          try {
            const email = await scrapeEmailFromWebsite(lead.website);
            if (email) {
              lead.email = email;
              lead.emailScraped = true;
              emailSource = 'website';
              console.log(`✅ Email found: ${email}`);
            }
          } catch (emailError) {
            console.error(`❌ Email scraping failed:`, emailError);
          }
        }
        
        // Try enhanced email discovery with social media
        try {
          console.log(`🔍 Enhanced email discovery for: ${lead.name}`);
          const enhancedResult = await enhancedEmailDiscovery(lead.name, lead.website || '');

          // Only accept emails from the same company domain (avoid free providers)
          if (!lead.email && lead.website) {
            const companyRoot = getDomainRoot(new URL(lead.website).hostname);
            const filtered = enhancedResult.emails.filter((e) => {
              const domain = (e.split('@')[1] || '').toLowerCase();
              return !isFreeEmailDomain(domain) && getDomainRoot(domain) === companyRoot;
            });
            if (filtered.length > 0) {
              lead.email = filtered[0];
              emailSource = enhancedResult.emailSources[filtered[0]] || 'social';
              console.log(`✅ Accepted domain-matching email: ${lead.email} (root: ${companyRoot})`);
            } else {
              console.log('ℹ️ Enhanced discovery found emails, but none matched company domain');
            }
          }

          
          // Store social profiles
          socialProfiles = enhancedResult.socialProfiles;
          
          console.log(`📱 Social profiles found:`, socialProfiles);
          console.log(`📧 Email source: ${emailSource}`);
          
        } catch (enhancedError) {
          console.error(`❌ Enhanced discovery failed:`, enhancedError);
        }
        
        // Add source and social profile information to lead
        if (lead.email) {
          lead.emailSource = emailSource;
        }
        if (Object.keys(socialProfiles).length > 0) {
          lead.socialProfiles = socialProfiles as any;
        }
        
        realLeads.push(lead);
        console.log(`✅ Successfully processed: ${lead.name}`);
        
      } catch (placeError) {
        console.error(`❌ Error processing place ${place.name}:`, placeError);
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
    console.log('📊 Total real leads found:', realLeads.length);
    console.log('📧 Leads with emails:', realLeads.filter(lead => lead.email).length);
    console.log('🏢 Final results summary:', realLeads.map(lead => ({ 
      name: lead.name, 
      address: lead.address,
      hasEmail: !!lead.email,
      place_id: lead.place_id
    })));
    
    // CRITICAL: Verify we're returning real data
    if (realLeads.length > 0) {
      console.log('✅ RETURNING REAL GOOGLE MAPS DATA');
    } else {
      console.log('⚠️ RETURNING EMPTY RESULTS');
    }
    
    return realLeads;
    
  } catch (error) {
    console.error('=== GOOGLE MAPS SEARCH ERROR ===');
    console.error('❌ Error details:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
};
