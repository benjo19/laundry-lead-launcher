import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const requestSchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).optional().default(10),
  gl: z.string().length(2).optional(),
  lr: z.string().regex(/^lang_[a-z]{2}$/).optional(),
});

type Lead = {
  name: string;
  address: string;
  phone: string;
  website: string;
  email?: string;
  emailScraped?: boolean;
  emailGuessed?: boolean;
  socialProfiles?: {
    linkedin?: string;
    facebook?: string;
    yellowPages?: string;
  };
  emailSource?: string;
  rating?: number;
  types: string[];
  place_id: string;
  geometry?: any;
  business_status?: string;
  user_ratings_total?: number;
};

const EMAIL_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function hostnameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function normalizeRoot(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, ms = 4000): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function scrapeEmailsFromPages(baseUrl: string): Promise<{ emails: string[]; source?: string }> {
  const root = normalizeRoot(baseUrl);
  if (!root) return { emails: [] };

  const candidates = [
    root,
    `${root}/contact`,
    `${root}/contact-us`,
    `${root}/kontakt`,
    `${root}/contacts`,
    `${root}/about`,
    `${root}/about-us`,
    `${root}/o-nama`,
    `${root}/impressum`,
  ];

  const found = new Set<string>();
  let firstSource: string | undefined;

  for (const page of candidates) {
    const res = await fetchWithTimeout(page, 4000);
    if (!res || !res.ok) continue;
    const html = await res.text();
    const matches = html.match(EMAIL_REGEX) || [];
    for (const m of matches) {
      // Skip obvious non-biz emails (images, scripts, etc. rarely match, but keep simple)
      const email = m.trim();
      if (!email.includes("example.")) {
        found.add(email);
        if (!firstSource) firstSource = page;
      }
    }
    // Stop early if we already have a few
    if (found.size >= 5) break;
  }

  return { emails: Array.from(found), source: firstSource };
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

    console.log('Google lead search request from user:', user.id);

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_CSE_API_KEY");
    const cx = Deno.env.get("GOOGLE_CSE_CX");

    if (!apiKey || !cx) {
      console.error("Missing GOOGLE_CSE_API_KEY or GOOGLE_CSE_CX");
      return new Response(JSON.stringify({ error: "CSE secrets not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and parse input
    const rawBody = await req.json().catch(() => ({}));
    const validationResult = requestSchema.safeParse(rawBody);
    
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

    const { q, limit, gl, lr } = validationResult.data;

    console.log("[google-web-lead-search] Query:", q);

    const cseUrl = new URL("https://www.googleapis.com/customsearch/v1");
    cseUrl.searchParams.set("key", apiKey);
    cseUrl.searchParams.set("cx", cx);
    cseUrl.searchParams.set("q", q);
    cseUrl.searchParams.set("num", String(limit));
    if (gl) cseUrl.searchParams.set("gl", gl);
    if (lr) cseUrl.searchParams.set("lr", lr);

    const cseRes = await fetch(cseUrl.toString());
    if (!cseRes.ok) {
      let errBody: any = null;
      let errText = '';
      try {
        errBody = await cseRes.clone().json();
      } catch {
        errText = await cseRes.text();
      }
      const status = cseRes.status;
      const details = errBody?.error?.message || errText || 'Unknown error';
      const reason = errBody?.error?.status;
      console.error("CSE error:", status, details);
      return new Response(
        JSON.stringify({ error: "CSE request failed", status, reason, details }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await cseRes.json();
    const items: any[] = Array.isArray(data.items) ? data.items : [];
    console.log("[google-web-lead-search] Items:", items.length);

    // Deduplicate by hostname
    const byHost = new Map<string, any>();
    for (const it of items) {
      const link = it.link || it.formattedUrl || it.displayLink;
      if (!link) continue;
      const host = hostnameFromUrl(link);
      if (!byHost.has(host)) {
        byHost.set(host, it);
      }
    }

    const uniqueItems = Array.from(byHost.values()).slice(0, limit);

    const leads: Lead[] = [];
    for (const it of uniqueItems) {
      const link: string = it.link || it.formattedUrl || "";
      const title: string = it.title || hostnameFromUrl(link);
      const host = hostnameFromUrl(link);

      const { emails, source } = await scrapeEmailsFromPages(link);

      const lead: Lead = {
        name: title || host,
        address: "",
        phone: "",
        website: link,
        email: emails[0],
        emailScraped: emails.length > 0,
        emailGuessed: false,
        socialProfiles: {},
        emailSource: source,
        rating: undefined as unknown as number,
        types: ["web"],
        place_id: `web:${host}`,
        geometry: undefined,
        business_status: undefined,
        user_ratings_total: undefined as unknown as number,
      };

      leads.push(lead);
    }

    console.log("[google-web-lead-search] Leads:", leads.length);

    return new Response(JSON.stringify({ leads }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[google-web-lead-search] Unhandled error:", e);
    return new Response(JSON.stringify({ error: "Unhandled error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
