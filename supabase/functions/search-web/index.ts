import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const url = new URL(req.url);

    let provider: "google_cse" | "serpapi" = "google_cse";
    let qRaw = "";
    let site = "";
    let num = 10;
    let page = 1;

    if (req.method === "GET") {
      provider = (url.searchParams.get("provider") as "google_cse" | "serpapi") || "google_cse";
      qRaw = url.searchParams.get("q")?.trim() || "";
      site = url.searchParams.get("site")?.trim() || "";
      num = Math.max(1, Math.min(parseInt(url.searchParams.get("num") || "10", 10), 10));
      page = Math.max(1, Math.min(parseInt(url.searchParams.get("page") || "1", 10), 10));
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      provider = (body.provider as "google_cse" | "serpapi") || "google_cse";
      qRaw = (body.q || "").toString().trim();
      site = (body.site || "").toString().trim();
      num = Math.max(1, Math.min(parseInt(body.num || "10", 10), 10));
      page = Math.max(1, Math.min(parseInt(body.page || "1", 10), 50));
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!qRaw) {
      return new Response(JSON.stringify({ error: "Missing q" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
