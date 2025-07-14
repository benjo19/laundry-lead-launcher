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
    // Remove script and style elements
    let cleanText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit content length
    if (cleanText.length > 10000) {
      cleanText = cleanText.substring(0, 10000) + '...';
    }

    return cleanText;

  } catch (error) {
    console.error('Website scraping error:', error);
    throw new Error(`Failed to scrape website: ${error.message}`);
  }
}