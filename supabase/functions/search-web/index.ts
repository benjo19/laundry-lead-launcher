import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  provider: z.enum(['google_cse', 'serpapi']).optional().default('google_cse'),
  q: z.string().min(1).max(500),
  site: z.string().max(200).optional(),
  num: z.number().int().min(1).max(100).optional().default(10),
  page: z.number().int().min(1).max(50).optional().default(1),
});

interface SearchItem {
  title: string;
  link: string;
  snippet?: string;
  displayLink?: string;
  favicon?: string | null;
  provider: "google_cse" | "serpapi";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

    console.log('Web search request from user:', user.id);

    // Parse and validate input
    let rawInput: any;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      rawInput = {
        provider: url.searchParams.get('provider') || 'google_cse',
        q: url.searchParams.get('q') || '',
        site: url.searchParams.get('site') || undefined,
        num: url.searchParams.get('num') ? parseInt(url.searchParams.get('num')!) : 10,
        page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1,
      };
    } else if (req.method === 'POST') {
      rawInput = await req.json().catch(() => ({}));
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validationResult = requestSchema.safeParse(rawInput);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { provider, q: qRaw, site, num, page } = validationResult.data;

    // Compose query with optional site filter
    const q = site ? `${qRaw} site:${site}` : qRaw;

    let items: SearchItem[] = [];

    if (provider === "google_cse") {
      const apiKey = Deno.env.get("GOOGLE_CSE_API_KEY");
      const cx = Deno.env.get("GOOGLE_CSE_CX");
      if (!apiKey || !cx) {
        return new Response(JSON.stringify({ error: "Missing GOOGLE_CSE_API_KEY or GOOGLE_CSE_CX" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const start = (page - 1) * num + 1; // CSE uses 1-based start index
      const cseUrl = new URL("https://www.googleapis.com/customsearch/v1");
      cseUrl.searchParams.set("key", apiKey);
      cseUrl.searchParams.set("cx", cx);
      cseUrl.searchParams.set("q", q);
      cseUrl.searchParams.set("num", String(num));
      cseUrl.searchParams.set("start", String(start));

      const res = await fetch(cseUrl.toString());
      if (!res.ok) {
        let details = "";
        try {
          const j = await res.clone().json();
          details = j?.error?.message || JSON.stringify(j);
        } catch {
          details = await res.text();
        }
        console.error("search-web CSE error:", res.status, details);
        return new Response(JSON.stringify({ error: "CSE request failed", status: res.status, details }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      const cseItems = (data.items || []) as any[];
      items = cseItems.map((it) => ({
        title: it.title,
        link: it.link,
        snippet: it.snippet,
        displayLink: it.displayLink,
        favicon: it.pagemap?.cse_thumbnail?.[0]?.src || null,
        provider: "google_cse",
      }));
    } else if (provider === "serpapi") {
      const serpKey = Deno.env.get("SERPAPI_API_KEY");
      if (!serpKey) {
        return new Response(JSON.stringify({ error: "Missing SERPAPI_API_KEY" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // SerpAPI: https://serpapi.com/search.json?q=...&engine=google&start=...
      const start = (page - 1) * num;
      const serpUrl = new URL("https://serpapi.com/search.json");
      serpUrl.searchParams.set("engine", "google");
      serpUrl.searchParams.set("q", q);
      serpUrl.searchParams.set("api_key", serpKey);
      serpUrl.searchParams.set("num", String(num));
      serpUrl.searchParams.set("start", String(start));

      const res = await fetch(serpUrl.toString());
      if (!res.ok) {
        let details = await res.text();
        try {
          const j = await res.clone().json();
          details = j?.error || JSON.stringify(j);
        } catch {}
        console.error("search-web SerpAPI error:", res.status, details);
        return new Response(JSON.stringify({ error: "SerpAPI request failed", status: res.status, details }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      const results = (data.organic_results || []) as any[];
      items = results.map((it) => ({
        title: it.title,
        link: it.link,
        snippet: it.snippet,
        displayLink: it.displayed_link,
        favicon: it.favicon || null,
        provider: "serpapi",
      }));
    }

    return new Response(
      JSON.stringify({ provider, q, num, page, count: items.length, results: items }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("search-web error:", e?.message || e);
    return new Response(JSON.stringify({ error: "Unhandled error", details: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
