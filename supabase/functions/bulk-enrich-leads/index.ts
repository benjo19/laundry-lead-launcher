import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkEnrichRequest {
  companies: string[]; // company names of leads to enrich
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      { global: { headers: { Authorization: authHeader } } }
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

    const body = await req.json() as BulkEnrichRequest;
    const companies = Array.isArray(body?.companies)
      ? body.companies.filter((c) => typeof c === 'string' && c.trim().length > 0)
      : [];

    if (companies.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No companies provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch leads owned by this user that match the provided companies AND have no email
    const { data: leads, error: leadsError } = await supabaseClient
      .from('leads')
      .select('id, company, website, location, email')
      .eq('user_id', user.id)
      .in('company', companies);

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch leads' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eligible = (leads || []).filter(
      (l) => !l.email || String(l.email).trim() === ''
    );

    console.log(`📦 Bulk enrichment requested for ${companies.length} companies, ${eligible.length} eligible (no email).`);

    // Trigger enrichment for each eligible lead in background.
    const enrichmentPromise = (async () => {
      for (const lead of eligible) {
        try {
          const res = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/enrich-lead`,
            {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                leadId: lead.id,
                companyName: lead.company,
                website: lead.website || undefined,
                location: lead.location || undefined,
              }),
            }
          );

          if (!res.ok) {
            console.error(`❌ enrich-lead failed for ${lead.company}: ${res.status}`);
          }
        } catch (e) {
          console.error(`❌ enrich-lead exception for ${lead.company}:`, e);
        }
      }
      console.log('✅ Bulk enrichment dispatch complete');
    })();

    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore
      EdgeRuntime.waitUntil(enrichmentPromise);
    } else {
      enrichmentPromise.catch(console.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        requested: companies.length,
        eligible: eligible.length,
        message: 'Bulk enrichment started in background',
      }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in bulk-enrich-leads:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
