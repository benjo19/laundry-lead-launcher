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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Getting request body...');
    const { message } = await req.json();
    console.log('Message received:', message);
    
    // Get the authorization header
    console.log('Getting auth header...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header found');
      throw new Error('No authorization header');
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`AI Knowledge Chat for user:`, user.id);

    // Get user's knowledge base
    const { data: knowledgeItems, error: knowledgeError } = await supabaseClient
      .from('user_knowledge')
      .select('title, content, type, url')
      .eq('user_id', user.id);

    if (knowledgeError) {
      throw new Error(`Failed to fetch knowledge base: ${knowledgeError.message}`);
    }

    // Prepare context from knowledge base - use more content
    const context = knowledgeItems?.map(item => 
      `[${item.type.toUpperCase()}] ${item.title}: ${item.content || 'No content'}`
    ).join('\n\n') || 'No knowledge base content available.';

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    console.log('Gemini API key present:', !!geminiApiKey);
    console.log('Anthropic API key present:', !!anthropicApiKey);

    // Get user's AI settings to determine provider
    const { data: userSettings, error: settingsError } = await supabaseClient
      .from('user_settings')
      .select('ai_settings')
      .eq('user_id', user.id)
      .single();

    let provider = 'gemini'; // default
    let aiApiKey = geminiApiKey;
    
    if (userSettings?.ai_settings) {
      const aiSettings = userSettings.ai_settings as any;
      if (aiSettings.provider) {
        provider = aiSettings.provider;
        if (provider === 'anthropic' && anthropicApiKey) {
          aiApiKey = anthropicApiKey;
        } else if (provider === 'openai' && aiSettings.api_key) {
          aiApiKey = aiSettings.api_key;
        } else if (provider === 'gemini' && geminiApiKey) {
          aiApiKey = geminiApiKey;
        }
      }
    }

    if (!aiApiKey) {
      console.log('ERROR: AI API key not configured for provider:', provider);
      throw new Error(`${provider} API key not configured`);
    }

    // Call appropriate AI service
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
      throw new Error(`Failed to get AI response: ${aiError.message}`);
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