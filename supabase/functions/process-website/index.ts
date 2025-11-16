import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { url, title } = await req.json();
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Processing website:`, { url, title, userId: user.id });

    // Scrape website content
    const scrapedContent = await scrapeWebsite(url);

    // Save to knowledge base
    const { error: insertError } = await supabaseClient
      .from('user_knowledge')
      .insert({
        user_id: user.id,
        title,
        content: scrapedContent,
        type: 'website',
        url,
        metadata: {
          scraped_at: new Date().toISOString(),
          url_domain: new URL(url).hostname
        }
      });

    if (insertError) {
      throw new Error(`Failed to save to knowledge base: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      content: scrapedContent.substring(0, 200) + '...' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-website function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function scrapeWebsite(url: string): Promise<string> {
  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      console.log('Firecrawl API key not found, using basic scraping');
      return await basicScrape(url);
    }

    console.log('Using Firecrawl API for scraping:', url);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        includeTags: ['article', 'main', 'content'],
        excludeTags: ['nav', 'footer', 'aside', 'header'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl API error:', response.status, errorText);
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Use markdown content if available, otherwise use cleaned HTML
    let content = data.markdown || data.html || '';
    
    // Limit content length
    if (content.length > 50000) {
      content = content.substring(0, 50000) + '...';
    }

    return content;

  } catch (error) {
    console.error('Website scraping error:', error);
    console.log('Falling back to basic scraping');
    return await basicScrape(url);
  }
}

async function basicScrape(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch website: ${response.status}`);
  }

  const html = await response.text();
  
  // Simple HTML text extraction
  let cleanText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanText.length > 10000) {
    cleanText = cleanText.substring(0, 10000) + '...';
  }

  return cleanText;
}