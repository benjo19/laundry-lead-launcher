import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApifyLeadSearchRequest {
  query: string;
  location?: string;
  maxResults?: number;
  language?: string;
}

interface Lead {
  company: string;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  rating?: number;
  reviews?: number;
  address?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location, maxResults = 20, language = 'hr' }: ApifyLeadSearchRequest = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY is not configured');
    }

    console.log('Starting Apify lead search:', { query, location, maxResults });

    // Use Google Maps Scraper actor
    const actorId = 'nwua9Gu5YrADL7ZDj'; // Official Google Maps Scraper
    
    const searchQuery = location ? `${query} ${location}` : query;
    
    const runInput = {
      searchStringsArray: [searchQuery],
      maxCrawledPlacesPerSearch: maxResults,
      language: language,
      includeWebsites: true,
      includeEmails: true,
      includePhoneNumbers: true,
      includeReviews: false,
      includeImages: false,
      includeOpeningHours: false,
    };

    console.log('Triggering Apify actor with input:', runInput);

    // Start the actor run
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runInput),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify actor start error:', runResponse.status, errorText);
      throw new Error(`Failed to start Apify actor: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log('Apify run started:', runId);

    // Wait for the run to finish (with timeout)
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
    
    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${APIFY_API_KEY}`
      );
      
      if (!statusResponse.ok) {
        throw new Error('Failed to check run status');
      }
      
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      attempts++;
      
      console.log(`Run status check ${attempts}:`, status);
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Apify run did not succeed. Status: ${status}`);
    }

    // Get the results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items?token=${APIFY_API_KEY}`
    );

    if (!resultsResponse.ok) {
      throw new Error('Failed to fetch results');
    }

    const results = await resultsResponse.json();
    console.log(`Retrieved ${results.length} results from Apify`);

    // Transform Apify results to our Lead format
    const leads: Lead[] = results.map((item: any) => ({
      company: item.title || item.name || 'Unknown',
      location: item.address || item.neighborhood || item.city || location,
      phone: item.phone || item.phoneNumber || null,
      email: item.email || (item.emails && item.emails[0]) || null,
      website: item.website || item.url || null,
      industry: item.categoryName || item.mainCategory || query,
      rating: item.totalScore || item.rating || null,
      reviews: item.reviewsCount || item.reviews || null,
      address: item.address || null,
    }));

    console.log('Apify lead search completed successfully');

    return new Response(
      JSON.stringify({ 
        leads,
        totalResults: leads.length,
        source: 'apify'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in apify-lead-search function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        leads: [],
        totalResults: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
