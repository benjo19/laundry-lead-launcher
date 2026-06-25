
import { industries, DiscoveredLead } from './SearchForm';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';
import { scrapeEmailFromWebsite, enhancedEmailDiscovery, discoverWebsiteFromSocial } from '@/utils/emailScraper';
import { supabase } from '@/integrations/supabase/client';

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
  _getPlaceDetails: (placeId: string, apiKey: string) => Promise<any>
) => {
  console.log('=== STARTING GOOGLE MAPS EDGE SEARCH ===');
  console.log('Search parameters:', {
    searchQuery: `"${searchQuery}"`,
    location: `"${location}"`,
    industry: `"${industry}"`,
    apiKey: apiKey ? `KEY PROVIDED (${apiKey.substring(0, 10)}...)` : 'MISSING API KEY'
  });

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Google Maps API ključ je potreban za pretraživanje');
  }

  const selectedIndustry = industries.find(ind => ind.value === industry);
  const finalQuery = searchQuery?.trim() || selectedIndustry?.query || 'business';

  try {
    console.log('🚀 Calling google-maps-lead-search edge function...');

    const { data, error } = await supabase.functions.invoke('google-maps-lead-search', {
      body: {
        query: finalQuery,
        location,
        apiKey,
        maxResults: 10,
      }
    });

    if (error) {
      console.error('❌ Google Maps edge function error:', error);
      throw new Error(error.message || 'Google Maps pretraga nije uspjela');
    }

    const places = Array.isArray(data?.leads) ? data.leads : [];
    console.log('=== GOOGLE MAPS EDGE RESPONSE ===');
    console.log('📊 Results count:', places.length);

    if (places.length === 0) {
      console.log('⚠️ No results returned from Google Maps edge function');
      return [];
    }

    const realLeads: DiscoveredLead[] = [];

    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      console.log(`\n--- Processing place ${i + 1}: ${place.name} ---`);

      const lead: DiscoveredLead = {
        name: place.name,
        address: place.address || '',
        phone: place.phone || '',
        website: place.website || '',
        rating: place.rating,
        types: place.types || [],
        place_id: place.place_id,
        geometry: place.geometry,
        business_status: place.business_status,
        user_ratings_total: place.user_ratings_total,
        address_components: place.address_components || [],
      };

      let emailSource = '';
      let socialProfiles = {};

      if (lead.website) {
        try {
          const email = await scrapeEmailFromWebsite(lead.website, lead.name);
          if (email) {
            lead.email = email;
            lead.emailScraped = true;
            emailSource = 'website';
          }
        } catch (emailError) {
          console.error('❌ Email scraping failed:', emailError);
        }
      } else {
        try {
          const discovered = await discoverWebsiteFromSocial(lead.name);
          if (discovered?.website) {
            lead.website = discovered.website;
            const email = await scrapeEmailFromWebsite(lead.website, lead.name);
            if (email) {
              lead.email = email;
              lead.emailScraped = true;
              emailSource = 'website';
            }
          }
        } catch (discoverErr) {
          console.error('❌ Website discovery from social failed:', discoverErr);
        }
      }

      try {
        const enhancedResult = await enhancedEmailDiscovery(lead.name, lead.website || '', location);

        if (!lead.email && lead.website) {
          const companyRoot = getDomainRoot(new URL(lead.website).hostname);
          const filtered = enhancedResult.emails.filter((e) => {
            const domain = (e.split('@')[1] || '').toLowerCase();
            return !isFreeEmailDomain(domain) && getDomainRoot(domain) === companyRoot;
          });

          if (filtered.length > 0) {
            lead.email = filtered[0];
            emailSource = enhancedResult.emailSources[filtered[0]] || 'social';
          }
        }

        socialProfiles = enhancedResult.socialProfiles;
      } catch (enhancedError) {
        console.error('❌ Enhanced discovery failed:', enhancedError);
      }

      if (lead.email) {
        lead.emailSource = emailSource;
      }
      if (Object.keys(socialProfiles).length > 0) {
        lead.socialProfiles = socialProfiles as any;
      }

      realLeads.push(lead);
      console.log(`✅ Successfully processed: ${lead.name}`);
    }

    return realLeads;
  } catch (error) {
    console.error('=== GOOGLE MAPS SEARCH ERROR ===');
    console.error('❌ Error details:', error);
    throw error;
  }
};

export const performApifyLeadSearch = async (
  searchQuery: string,
  location: string,
  industry: string,
  maxResults: number = 20
) => {
  console.log('=== STARTING APIFY LEAD SEARCH ===');
  console.log('Search parameters:', { 
    searchQuery: `"${searchQuery}"`, 
    location: `"${location}"`, 
    industry: `"${industry}"`,
    maxResults 
  });

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
  
  console.log('🔍 FINAL APIFY QUERY:', `"${finalQuery}"`);
  
  try {
    console.log('🚀 Calling Apify edge function...');
    
    const { data, error } = await supabase.functions.invoke('apify-lead-search', {
      body: {
        query: finalQuery,
        location: location,
        maxResults: maxResults,
        language: 'hr'
      }
    });

    if (error) {
      console.error('❌ Apify edge function error:', error);
      throw new Error(`Apify search failed: ${error.message}`);
    }

    console.log('=== APIFY API RESPONSE ===');
    console.log('📊 Results count:', data?.leads?.length || 0);
    console.log('🏢 First 3 results preview:', data?.leads?.slice(0, 3) || []);

    if (!data?.leads || data.leads.length === 0) {
      console.log('⚠️ No results returned from Apify');
      return [];
    }

    console.log('=== PROCESSING APIFY RESULTS WITH EMAIL DISCOVERY ===');

    // Process each lead with email discovery
    const apifyLeads: DiscoveredLead[] = [];
    
    for (let i = 0; i < data.leads.length; i++) {
      const rawLead = data.leads[i];
      console.log(`\n--- Processing Apify lead ${i + 1}: ${rawLead.company} ---`);
      
      const lead: DiscoveredLead = {
        name: rawLead.company || 'Unknown',
        address: rawLead.address || rawLead.location || '',
        phone: rawLead.phone || '',
        website: rawLead.website || '',
        email: rawLead.email || '',
        emailScraped: !!rawLead.email,
        rating: rawLead.rating,
        types: rawLead.industry ? [rawLead.industry] : [],
        place_id: `apify_${Date.now()}_${Math.random()}`,
        business_status: 'OPERATIONAL',
        user_ratings_total: rawLead.reviews || 0,
        emailSource: rawLead.email ? 'apify' : undefined
      };

      // If no email but we have a website, try to scrape it
      if (!lead.email && lead.website) {
        try {
          const scrapedEmail = await scrapeEmailFromWebsite(lead.website, lead.name);
          if (scrapedEmail) {
            lead.email = scrapedEmail;
            lead.emailScraped = true;
            lead.emailSource = 'website';
          }
        } catch (emailError) {
          console.error(`❌ Email scraping failed:`, emailError);
        }
      }

      // Try enhanced email discovery with social media
      if (!lead.email || !lead.website) {
        try {
          const enhancedResult = await enhancedEmailDiscovery(lead.name, lead.website || '', location);

          // Only accept emails from the same company domain (avoid free providers)
          if (!lead.email && lead.website) {
            const companyRoot = getDomainRoot(new URL(lead.website).hostname);
            const filtered = enhancedResult.emails.filter((e) => {
              const domain = (e.split('@')[1] || '').toLowerCase();
              return !isFreeEmailDomain(domain) && getDomainRoot(domain) === companyRoot;
            });
            if (filtered.length > 0) {
              lead.email = filtered[0];
              lead.emailSource = enhancedResult.emailSources[filtered[0]] || 'social';
              lead.emailScraped = true;
            }
          }
          
          // Store social profiles
          if (Object.keys(enhancedResult.socialProfiles).length > 0) {
            lead.socialProfiles = enhancedResult.socialProfiles as any;
          }
        } catch (enhancedError) {
          console.error(`❌ Enhanced discovery failed:`, enhancedError);
        }
      }

      apifyLeads.push(lead);
    }

    if (apifyLeads.length > 0) {
      console.log('✅ RETURNING APIFY DATA');
    } else {
      console.log('⚠️ RETURNING EMPTY RESULTS');
    }

    return apifyLeads;

  } catch (error) {
    console.error('=== APIFY SEARCH ERROR ===');
    console.error('❌ Error details:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
};

export const performFirecrawlLeadSearch = async (
  searchQuery: string,
  location: string,
  country: string,
  industry: string
) => {
  console.log('=== STARTING FIRECRAWL LEAD SEARCH ===');
  console.log('Search parameters:', { 
    searchQuery: `"${searchQuery}"`, 
    location: `"${location}"`,
    country: `"${country}"`,
    industry: `"${industry}"` 
  });

  try {
    console.log('🚀 Calling Firecrawl edge function...');
    
    const { data, error } = await supabase.functions.invoke('firecrawl-lead-search', {
      body: {
        searchQuery,
        location,
        country,
        industry
      }
    });

    if (error) {
      console.error('❌ Firecrawl edge function error:', error);
      throw new Error(`Firecrawl search failed: ${error.message}`);
    }

    console.log('=== FIRECRAWL API RESPONSE ===');
    console.log('📊 Results count:', data?.leads?.length || 0);
    console.log('🏢 First 3 results preview:', data?.leads?.slice(0, 3) || []);

    if (!data?.leads || data.leads.length === 0) {
      console.log('⚠️ No results returned from Firecrawl');
      return [];
    }

    const leads: DiscoveredLead[] = data.leads;

    console.log(`\n=== FIRECRAWL SEARCH COMPLETE ===`);
    console.log(`📊 Total leads: ${leads.length}`);
    console.log(`📧 Leads with email: ${leads.filter(l => l.email).length}`);
    console.log(`🌐 Leads with website: ${leads.filter(l => l.website).length}`);

    return leads;

  } catch (error) {
    console.error('❌ Firecrawl search error:', error);
    throw error;
  }
};
