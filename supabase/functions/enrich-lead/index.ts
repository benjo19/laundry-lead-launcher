import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichRequest {
  leadId: string;
  companyName: string;
  website?: string;
  location?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { leadId, companyName, website, location }: EnrichRequest = await req.json();
    
    console.log('🔍 Starting lead enrichment:', { leadId, companyName, website, location });

    // Start enrichment in background
    const enrichmentPromise = (async () => {
      try {
        let enrichedData: any = {
          updated_at: new Date().toISOString()
        };

        // If we have a website, scrape for emails and social profiles
        if (website && website.trim() !== '') {
          console.log('📧 Scraping contact info from website...');
          
          const scrapeResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/scrape-contact`,
            {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                website,
                companyName,
                location,
              }),
            }
          );

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            console.log('✅ Scrape results:', scrapeData);

            // Update lead with scraped data
            if (scrapeData.emails && scrapeData.emails.length > 0) {
              enrichedData.email = scrapeData.emails[0];
            }

            // Add social profiles to notes
            if (scrapeData.socialProfiles && Object.keys(scrapeData.socialProfiles).length > 0) {
              const socialLinks = Object.entries(scrapeData.socialProfiles)
                .map(([platform, url]) => `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url}`)
                .join('\n');
              
              // Get existing notes and append social profiles
              const { data: existingLead } = await supabaseClient
                .from('leads')
                .select('notes')
                .eq('id', leadId)
                .single();
              
              const existingNotes = existingLead?.notes || '';
              enrichedData.notes = existingNotes 
                ? `${existingNotes}\n\n📱 Social Profiles:\n${socialLinks}`
                : `📱 Social Profiles:\n${socialLinks}`;
            }
          } else {
            console.log('⚠️ Scrape failed:', scrapeResponse.status);
          }
        } else {
          console.log('⚠️ No website provided, skipping contact scraping');
        }

        // Update lead in database
        if (Object.keys(enrichedData).length > 1) { // More than just updated_at
          console.log('💾 Updating lead with enriched data:', enrichedData);
          
          const { error: updateError } = await supabaseClient
            .from('leads')
            .update(enrichedData)
            .eq('id', leadId)
            .eq('user_id', user.id);

          if (updateError) {
            console.error('❌ Error updating lead:', updateError);
          } else {
            console.log('✅ Lead enriched successfully');
          }
        } else {
          console.log('ℹ️ No additional data found to enrich');
        }
      } catch (error) {
        console.error('❌ Error in background enrichment:', error);
      }
    })();

    // Use waitUntil to continue execution in background
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore
      EdgeRuntime.waitUntil(enrichmentPromise);
    } else {
      // Fallback for local testing
      enrichmentPromise.catch(console.error);
    }

    // Return immediate response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead enrichment started in background',
        leadId 
      }),
      { 
        status: 202, // Accepted
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in enrich-lead:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
