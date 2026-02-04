import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  console.log('AI Knowledge Chat function called:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { message } = await req.json();
    console.log('Message received:', message);
    
    // Extract user id from JWT
    const token = authHeader.replace('Bearer ', '');
    const payloadPart = token.split('.')[1];
    let userId = '';
    try {
      const decoded = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
      userId = decoded.sub;
    } catch (e) {
      console.log('Failed to decode JWT:', e);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`AI Knowledge Chat for user:`, userId);

    // Get user's knowledge base
    const { data: knowledgeItems, error: knowledgeError } = await supabaseClient
      .from('user_knowledge')
      .select('id, title, content, type, url, file_path')
      .eq('user_id', userId);

    if (knowledgeError) {
      throw new Error(`Failed to fetch knowledge base: ${knowledgeError.message}`);
    }

    const processedItems = [...(knowledgeItems || [])];
    console.log('Knowledge items count:', processedItems.length);

    // Fuzzy matching for better search
    const buildFuzzyRegex = (term: string) => {
      const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = escaped.split('').join('[^\\p{L}\\p{N}]{0,3}');
      return new RegExp(pattern, 'iu');
    };

    const findMatchIndex = (text: string, term: string) => {
      const re = buildFuzzyRegex(term);
      const m = re.exec(text);
      if (m && typeof m.index === 'number') return m.index;
      const lc = text.toLowerCase();
      return lc.indexOf(term.toLowerCase());
    };

    const makeSnippet = (text: string, idx: number, radius = 700) => {
      if (idx < 0) return text.slice(0, radius);
      const start = Math.max(0, idx - radius);
      const end = Math.min(text.length, idx + radius);
      return text.slice(start, end);
    };

    const terms = message
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w: string) => w.length >= 3);

    // Build per-item snippets prioritizing matches
    const sections = (processedItems || []).map((item) => {
      const content = item.content || '';
      let snippet = '';
      for (const t of terms) {
        const idx = findMatchIndex(content, t);
        if (idx !== -1) {
          snippet = makeSnippet(content, idx, 700);
          break;
        }
      }
      if (!snippet) snippet = content.slice(0, 1200);
      return `[${(item.type || 'doc').toUpperCase()}] ${item.title}\n${snippet}`;
    });

    let context = sections.join('\n\n---\n\n');
    const MAX_CONTEXT = 16000;
    if (context.length > MAX_CONTEXT) context = context.slice(0, MAX_CONTEXT);

    // Use Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calling Lovable AI Gateway...');

    const aiResponse = await callLovableAI(LOVABLE_API_KEY, context, message);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      knowledgeItemsCount: knowledgeItems?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-knowledge-chat function:', error);
    
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return new Response(JSON.stringify({ error: 'Previše zahtjeva. Pokušajte kasnije.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (error.message?.includes('402') || error.message?.includes('payment')) {
      return new Response(JSON.stringify({ error: 'Potrebno dodati kredite za AI.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callLovableAI(apiKey: string, context: string, message: string): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `Ti si napredni AI asistent koji ima pristup korisničkoj knowledge bazi. Odgovori na hrvatskom jeziku u profesionalnom i prijateljskom tonu.

INSTRUKCIJE ZA ODGOVARANJE:
- Koristi informacije iz knowledge baze kao glavni izvor
- Ako je informacija dostupna u bazi, odgovori detaljno i precizno
- Ako neka informacija nije u bazi, možeš kombinirati svoje znanje ali uvijek spomeni što je iz baze a što iz općeg znanja
- Budi konkretan i specifičan u odgovorima
- Navedi iz kojeg dokumenta/izvora koristiš informacije kad je to relevantno
- Ako nema relevantnih informacija u bazi za pitanje, jasno to reci
- Ponašaj se kao stručni savjetnik koji odlično poznaje sadržaj iz knowledge baze`
        },
        {
          role: 'user',
          content: `KNOWLEDGE BAZA:\n${context}\n\nKORISNIČKO PITANJE: ${message}\n\nOdgovori detaljno, profesionalno i korisno:`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI Gateway error:', response.status, errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Nema odgovora od AI-a.';
}
