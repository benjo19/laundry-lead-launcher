import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const requestSchema = z.object({
  query: z.string().min(1).max(300),
  location: z.string().min(1).max(200),
  apiKey: z.string().min(10).max(200),
  maxResults: z.number().int().min(1).max(20).optional().default(10),
});

const detailsFields = 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry,business_status,opening_hours';

async function fetchJsonWithTimeout(url: string, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return { response, data };
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatHttpError(status: number, body: unknown) {
  const errorText = typeof body === 'string' ? body : JSON.stringify(body);

  if (status === 403) {
    return 'Google Maps API: Pristup zabranjen.\n\nMogući razlozi:\n• Places API nije omogućen u Google Cloud Console\n• API ključ nema potrebna dopuštenja\n• API ključ ima restrikcije koje blokiraju server-side pozive';
  }

  if (status === 400) {
    return 'Google Maps API: Neispravan zahtjev.\n\nProvjerite je li API ključ ispravan i je li Places API omogućen.';
  }

  if (status === 429) {
    return 'Google Maps API: Prekoračen limit zahtjeva.\n\nProvjerite kvote i billing u Google Cloud Console.';
  }

  return `Google Maps API greška: ${status}\n${errorText}`;
}

function formatGoogleStatusError(status: string, message?: string) {
  if (status === 'REQUEST_DENIED') {
    return 'Google Maps API: Zahtjev odbijen.\n\nMogući razlozi:\n• Places API nije omogućen\n• API ključ nema dopuštenja\n• API ključ ima postavljene restrikcije za browser referrer i ne dopušta server-side pozive' + (message ? `\n\nGoogle poruka: ${message}` : '');
  }

  if (status === 'OVER_QUERY_LIMIT') {
    return 'Google Maps API: Prekoračen limit.\n\nProvjerite billing i kvote u Google Cloud Console.';
  }

  if (status === 'INVALID_REQUEST') {
    return 'Google Maps API: Neispravan zahtjev.' + (message ? `\n\nGoogle poruka: ${message}` : '');
  }

  return `Google Maps API status: ${status}${message ? `\n${message}` : ''}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, location, apiKey, maxResults } = parsed.data;
    const fullSearchQuery = `${query} in ${location}`;

    console.log('[google-maps-lead-search] Query:', fullSearchQuery);

    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fullSearchQuery)}&key=${encodeURIComponent(apiKey)}`;
    const { response: searchResponse, data: searchData } = await fetchJsonWithTimeout(textSearchUrl);

    if (!searchResponse.ok) {
      throw new Error(formatHttpError(searchResponse.status, searchData));
    }

    if (searchData?.status !== 'OK' && searchData?.status !== 'ZERO_RESULTS') {
      throw new Error(formatGoogleStatusError(searchData?.status, searchData?.error_message));
    }

    if (searchData?.status === 'ZERO_RESULTS' || !Array.isArray(searchData?.results) || searchData.results.length === 0) {
      return new Response(JSON.stringify({ leads: [], totalResults: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const places = searchData.results.slice(0, maxResults);

    const detailedLeads = await Promise.all(
      places.map(async (place: any) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place.place_id)}&fields=${encodeURIComponent(detailsFields)}&key=${encodeURIComponent(apiKey)}`;
          const { response: detailsResponse, data: detailsData } = await fetchJsonWithTimeout(detailsUrl);

          const details = detailsResponse.ok && detailsData?.status === 'OK' ? detailsData.result : null;

          return {
            name: place.name,
            address: place.formatted_address || details?.formatted_address || '',
            phone: details?.formatted_phone_number || '',
            website: details?.website || '',
            rating: place.rating || details?.rating,
            types: place.types || details?.types || [],
            place_id: place.place_id,
            geometry: place.geometry || details?.geometry,
            business_status: place.business_status || details?.business_status,
            user_ratings_total: place.user_ratings_total || details?.user_ratings_total,
          };
        } catch (error) {
          console.error('[google-maps-lead-search] Place details failed:', place.place_id, error);
          return {
            name: place.name,
            address: place.formatted_address || '',
            phone: '',
            website: '',
            rating: place.rating,
            types: place.types || [],
            place_id: place.place_id,
            geometry: place.geometry,
            business_status: place.business_status,
            user_ratings_total: place.user_ratings_total,
          };
        }
      })
    );

    return new Response(JSON.stringify({ leads: detailedLeads, totalResults: detailedLeads.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[google-maps-lead-search] Error:', error);

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      leads: [],
      totalResults: 0,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});