import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('AI Knowledge Chat function called:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    console.log('Getting auth header...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with the user's JWT so RLS applies correctly
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    console.log('Getting request body...');
    const { message } = await req.json();
    console.log('Message received:', message);
    
    // Extract user id (sub) from JWT; verify_jwt is enforced by gateway
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

    const user = { id: userId };


    console.log(`AI Knowledge Chat for user:`, user.id);

    // Get user's knowledge base
    const { data: knowledgeItems, error: knowledgeError } = await supabaseClient
      .from('user_knowledge')
      .select('id, title, content, type, url, file_path')
      .eq('user_id', user.id);

    if (knowledgeError) {
      throw new Error(`Failed to fetch knowledge base: ${knowledgeError.message}`);
    }

    // Attempt to auto-repair bad PDF entries (binary/too short) by re-extracting with Gemini
    const processedItems = [...(knowledgeItems || [])];

    const needsReprocess = (c?: string) => {
      const content = c || '';
      if (content.length < 50) return true;
      const nonPrintable = content.replace(/[\t\n\r\x20-\uFFFF]/g, '');
      const ratio = nonPrintable.length / content.length;
      return ratio > 0.2;
    };

    if (processedItems.length && Deno.env.get('GEMINI_API_KEY')) {
      const geminiKey = Deno.env.get('GEMINI_API_KEY')!;
      const candidates = processedItems
        .filter(it => (it.type === 'pdf') && needsReprocess(it.content) && it.file_path)
        .slice(0, 3);

      for (const it of candidates) {
        try {
          const { data: fileBlob, error: dlErr } = await supabaseClient.storage
            .from('user-documents')
            .download(it.file_path as string);
          if (dlErr || !fileBlob) {
            console.log('Skip reprocess (download failed):', dlErr?.message);
            continue;
          }
          // Convert to base64
          const arr = await fileBlob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arr)));

          // Ask Gemini to extract text from PDF
          const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: 'Extract all readable text from this PDF for QA over products (models/specs). Return clean text.' },
                  { inline_data: { mime_type: 'application/pdf', data: base64 } }
                ]
              }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 6000 }
            })
          });
          if (!resp.ok) {
            console.log('Gemini extraction failed:', resp.status);
            continue;
          }
          const data = await resp.json();
          const extracted: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (extracted && extracted.length > 50) {
            await supabaseClient
              .from('user_knowledge')
              .update({ content: extracted })
              .eq('id', it.id)
              .eq('user_id', user.id);
            it.content = extracted;
          }
        } catch (e) {
          console.log('Reprocess error:', e);
        }
      }
    }

    // Prepare context from knowledge base using relevance-focused snippets
    console.log('Knowledge items count:', processedItems.length);

    const makeSnippet = (text: string, term: string, radius = 500) => {
      const lc = text.toLowerCase();
      const idx = lc.indexOf(term.toLowerCase());
      if (idx === -1) return text.slice(0, radius);
      const start = Math.max(0, idx - radius);
      const end = Math.min(text.length, idx + radius);
      return text.slice(start, end);
    };

    const terms = message
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter(w => w.length >= 3);

    // Build per-item snippets prioritizing matches
    const sections = (processedItems || []).map((item) => {
      const content = item.content || '';
      let snippet = '';
      for (const t of terms) {
        if (content.toLowerCase().includes(t)) {
          snippet = makeSnippet(content, t, 700);
          break;
        }
      }
      if (!snippet) snippet = content.slice(0, 1200);
      return `[${(item.type || 'doc').toUpperCase()}] ${item.title}\n${snippet}`;
    });

    // Concatenate and trim to safe length while keeping early items
    let context = sections.join('\n\n---\n\n');
    const MAX_CONTEXT = 16000;
    if (context.length > MAX_CONTEXT) context = context.slice(0, MAX_CONTEXT);


    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    console.log('Gemini API key present:', !!geminiApiKey);
    console.log('Anthropic API key present:', !!anthropicApiKey);

    // Get user's AI settings to determine provider
    const { data: userSettings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('ai_settings')
      .eq('user_id', user.id)
      .maybeSingle();

    let provider = 'gemini'; // default fallback
    let aiApiKey = geminiApiKey;
    
    if (userSettings?.ai_settings) {
      const aiSettings = userSettings.ai_settings as any;
      const openaiKey = aiSettings.openai_api_key || aiSettings.api_key; // support legacy
      const geminiKey = aiSettings.gemini_api_key || geminiApiKey;
      
      if (aiSettings.provider === 'openai' && openaiKey) {
        provider = 'openai';
        aiApiKey = openaiKey;
      } else if (aiSettings.provider === 'gemini' && geminiKey) {
        provider = 'gemini';
        aiApiKey = geminiKey;
      } else if (anthropicApiKey && aiSettings.provider === 'anthropic') {
        provider = 'anthropic';
        aiApiKey = anthropicApiKey;
      } else {
        console.log(`Requested provider ${aiSettings.provider} not available, falling back to gemini`);
      }
    }

    if (!aiApiKey) {
      console.log('ERROR: AI API key not configured for provider:', provider);
      throw new Error(`${provider} API key not configured`);
    }

    // Call appropriate AI service with graceful fallback
    console.log(`Calling ${provider} API...`);
    try {
      let aiResponse: string;

      if (provider === 'anthropic') {
        aiResponse = await callAnthropicAPI(aiApiKey, context, message);
      } else if (provider === 'openai') {
        aiResponse = await callOpenAIAPI(aiApiKey, context, message);
      } else {
        aiResponse = await callGeminiAPI(aiApiKey, context, message);
      }

      return new Response(JSON.stringify({ 
        response: aiResponse,
        knowledgeItemsCount: knowledgeItems?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (aiError) {
      console.error(`${provider} API error:`, aiError);
      // Fallback to Gemini if available and not already using it
      if (provider !== 'gemini' && geminiApiKey) {
        console.log('Falling back to Gemini provider...');
        try {
          const aiResponse = await callGeminiAPI(geminiApiKey, context, message);
          return new Response(JSON.stringify({ 
            response: aiResponse,
            knowledgeItemsCount: knowledgeItems?.length || 0,
            fallback: 'gemini'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (fallbackError) {
          console.error('Fallback to Gemini failed:', fallbackError);
        }
      }
      throw new Error(`Failed to get AI response: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
    }

  } catch (error) {
    console.error('Error in ai-knowledge-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callAnthropicAPI(apiKey: string, context: string, message: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `Ti si napredni AI asistent koji ima pristup korisničkoj knowledge bazi. Odgovori na hrvatska jeziku u profesionalnom i prijateljskom tonu.

KNOWLEDGE BAZA:
${context}

INSTRUKCIJE ZA ODGOVARANJE:
- Koristi informacije iz knowledge baze kao glavni izvor
- Ako je informacija dostupna u bazi, odgovori detaljno i precizno
- Ako neka informacija nije u bazi, možeš kombinirati svoje znanje ali uvijek spomeni što je iz baze a što iz općeg znanja
- Budi konkretan i specifičan u odgovorima
- Navedi iz kojeg dokumenta/izvora koristiš informacije kad je to relevantno
- Ako nema relevantnih informacija u bazi za pitanje, jasno to reci
- Ponašaj se kao stručni savjetnik koji odlično poznaje sadržaj iz knowledge baze

KORISNIČKO PITANJE: ${message}

Odgovori detaljno, profesionalno i korisno:`
      }]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Anthropic API error');
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callOpenAIAPI(apiKey: string, context: string, message: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Ti si napredni AI asistent koji ima pristup korisničkoj knowledge bazi. Odgovori na hrvatska jeziku u profesionalnom i prijateljskom tonu.

KNOWLEDGE BAZA:
${context}

INSTRUKCIJE ZA ODGOVARANJE:
- Koristi informacije iz knowledge baze kao glavni izvor
- Ako je informacija dostupna u bazi, odgovori detaljno i precizno
- Ako neka informacija nije u bazi, možeš kombinirati svoje znanje ali uvijek spomeni što je iz baze a što iz općeg znanja
- Budi konkretan i specifičan u odgovorima
- Navedi iz kojeg dokumenta/izvora koristiš informacije kad je to relevantno
- Ako nema relevantnih informacija u bazi za pitanje, jasno to reci
- Ponašaj se kao stručni savjetnik koji odlično poznaje sadržaj iz knowledge baze

KORISNIČKO PITANJE: ${message}

Odgovori detaljno, profesionalno i korisno:`
      }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGeminiAPI(apiKey: string, context: string, message: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Ti si napredni AI asistent koji ima pristup korisničkoj knowledge bazi. Odgovori na hrvatska jeziku u profesionalnom i prijateljskom tonu.

KNOWLEDGE BAZA:
${context}

INSTRUKCIJE ZA ODGOVARANJE:
- Koristi informacije iz knowledge baze kao glavni izvor
- Ako je informacija dostupna u bazi, odgovori detaljno i precizno
- Ako neka informacija nije u bazi, možeš kombinirati svoje znanje ali uvijek spomeni što je iz baze a što iz općeg znanja
- Budi konkretan i specifičan u odgovorima
- Navedi iz kojeg dokumenta/izvora koristiš informacije kad je to relevantno
- Ako nema relevantnih informacija u bazi za pitanje, jasno to reci
- Ponašaj se kao stručni savjetnik koji odlično poznaje sadržaj iz knowledge baze

KORISNIČKO PITANJE: ${message}

Odgovori detaljno, profesionalno i korisno:`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2000,
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}