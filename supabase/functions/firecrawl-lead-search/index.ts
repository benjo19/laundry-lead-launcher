import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Firecrawl API key nije konfiguriran. Molimo dodajte FIRECRAWL_API_KEY u Supabase Edge Function Secrets.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { searchQuery, location, country, industry } = await req.json();
    
    console.log('Firecrawl Lead Search:', { searchQuery, location, country, industry });

    // Build search query
    const fullQuery = `${searchQuery || industry} ${location} ${country} contact email phone`;
    
    console.log('Searching with Firecrawl:', fullQuery);

    // Step 1: Search for relevant websites using Firecrawl search endpoint
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: fullQuery,
        limit: 10,
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Firecrawl search error:', searchResponse.status, errorText);
      throw new Error(`Firecrawl search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Firecrawl search results:', searchData.data?.length || 0, 'results');

    if (!searchData.data || searchData.data.length === 0) {
      return new Response(
        JSON.stringify({ leads: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: For each search result, scrape the page to extract structured data
    const leads = [];
    
    for (const result of searchData.data.slice(0, 5)) { // Limit to 5 to avoid too many API calls
      try {
        console.log('Scraping:', result.url);
        
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: result.url,
            formats: ['extract'],
            extract: {
              schema: {
                type: 'object',
                properties: {
                  company_name: { 
                    type: 'string',
                    description: 'The name of the business or company'
                  },
                  address: { 
                    type: 'string',
                    description: 'Full physical address of the business'
                  },
                  email: { 
                    type: 'string',
                    description: 'Contact email address'
                  },
                  phone: { 
                    type: 'string',
                    description: 'Contact phone number'
                  },
                  description: {
                    type: 'string',
                    description: 'Brief description of what the business does'
                  },
                },
                required: ['company_name']
              }
            }
          }),
        });

        if (!scrapeResponse.ok) {
          console.error('Scrape failed for:', result.url);
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const extracted = scrapeData.extract;

        if (extracted && extracted.company_name) {
          const lead = {
            name: extracted.company_name || result.title || 'Unknown Business',
            address: extracted.address || '',
            phone: extracted.phone || '',
            website: result.url,
            email: extracted.email || '',
            emailScraped: !!extracted.email,
            emailSource: extracted.email ? 'firecrawl' : '',
            types: [industry || 'business'],
            place_id: `firecrawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            business_status: 'OPERATIONAL',
            rating: 0,
            user_ratings_total: 0,
          };

          console.log('Found lead:', lead.name);
          leads.push(lead);
        }
      } catch (scrapeError) {
        console.error('Error scraping URL:', result.url, scrapeError);
        continue;
      }
    }

    console.log(`Firecrawl search completed: ${leads.length} leads found`);

    return new Response(
      JSON.stringify({ leads }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in firecrawl-lead-search:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
