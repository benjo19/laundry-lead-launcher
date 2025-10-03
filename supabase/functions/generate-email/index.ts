import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailGenerationRequest {
  recipientCompany: string;
  recipientEmail: string;
  emailType: 'intro' | 'follow-up' | 'proposal' | 'reminder';
  additionalContext?: string;
  industry?: string;
  businessContext?: string;
  companyInfo?: {
    location?: string;
    website?: string;
    rating?: number;
    businessType?: string;
  };
}

interface GeneratedEmailContent {
  subject: string;
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authorization token');
    }

    console.log('Generating email for user:', user.id);

    // Get user's AI settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('ai_settings')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !userSettings?.ai_settings) {
      throw new Error('AI settings not configured. Please set up your AI API key in Settings.');
    }

    const aiSettings = userSettings.ai_settings as any;
    const customSystemPrompt = aiSettings.custom_system_prompt;
    
    // Get provider (default to gemini since it's free)
    let aiProvider = aiSettings.provider || 'gemini';
    
    // Get the correct API key based on provider
    let apiKey: string;
    if (aiProvider === 'gemini') {
      apiKey = aiSettings.gemini_api_key || aiSettings.api_key;
    } else if (aiProvider === 'openai') {
      apiKey = aiSettings.openai_api_key || aiSettings.api_key;
    } else {
      apiKey = aiSettings.api_key;
    }

    // Auto-detect provider if still unclear
    if (!apiKey || (!apiKey.startsWith('AIzaSy') && !apiKey.startsWith('sk-'))) {
      // Try to find any valid key
      if (aiSettings.gemini_api_key?.startsWith('AIzaSy')) {
        apiKey = aiSettings.gemini_api_key;
        aiProvider = 'gemini';
      } else if (aiSettings.openai_api_key?.startsWith('sk-')) {
        apiKey = aiSettings.openai_api_key;
        aiProvider = 'openai';
      }
    }

    if (!apiKey) {
      throw new Error('AI API key not found in settings. Please configure it in Settings.');
    }

    console.log(`Using AI provider: ${aiProvider}, API key starts with: ${apiKey.substring(0, 10)}`);

    // Parse request
    const params: EmailGenerationRequest = await req.json();

    console.log(`About to generate with provider: ${aiProvider}, API key starts with: ${apiKey.substring(0, 10)}...`);

    // Generate email using AI
    const generatedEmail = await generatePersonalizedEmail(params, apiKey, aiProvider, customSystemPrompt);

    return new Response(
      JSON.stringify(generatedEmail),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate email' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function generatePersonalizedEmail(
  params: EmailGenerationRequest, 
  apiKey: string, 
  provider: string,
  customSystemPrompt?: string
): Promise<GeneratedEmailContent> {
  const systemPrompt = buildSystemPrompt(params.businessContext, customSystemPrompt);
  const userPrompt = buildUserPrompt(params);

  try {
    if (provider === 'gemini') {
      return await generateWithGemini(systemPrompt, userPrompt, apiKey);
    } else {
      return await generateWithOpenAI(systemPrompt, userPrompt, apiKey);
    }
  } catch (error) {
    console.error('AI Email generation error:', error);
    throw error;
  }
}

async function generateWithOpenAI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<GeneratedEmailContent> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to generate email with OpenAI');
  }

  const data = await response.json();
  const generatedText = data.choices[0]?.message?.content;

  if (!generatedText) {
    throw new Error('No content generated from OpenAI');
  }

  return parseGeneratedEmail(generatedText);
}

async function generateWithGemini(systemPrompt: string, userPrompt: string, apiKey: string): Promise<GeneratedEmailContent> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1000,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to generate email with Gemini');
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error('No content generated from Gemini');
  }

  return parseGeneratedEmail(generatedText);
}

function buildSystemPrompt(businessContext?: string, customSystemPrompt?: string): string {
  let systemPrompt = `Ti si ekspert za B2B marketing i prodaju. Tvoj zadatak je kreiranje personaliziranih, profesionalnih emailova na hrvatskom jeziku.

VAŽNE SMJERNICE:
- Uvijek piši na hrvatskom jeziku
- Budi profesionalan ali pristupačan
- Fokusiraj se na koristi za klijenta, ne na funkcionalnosti
- Koristi konkretne brojke i primjere kad god možeš
- Prilagodi ton prema vrsti emaila
- Email treba biti kratak i direktan (maksimalno 200 riječi)
- Uvijek završi jasnim pozivom na akciju

STRUKTURA ODGOVORA:
Odgovori u sljedećem formatu:
SUBJECT: [naslov emaila]
CONTENT: [sadržaj emaila]`;

  if (customSystemPrompt) {
    systemPrompt += `\n\nDODATNE INSTRUKCIJE ZA PONAŠANJE:\n${customSystemPrompt}`;
  }

  if (businessContext) {
    systemPrompt += `\n\nINFORMACIJE O POŠILJATELJU:\n${businessContext}`;
  }

  return systemPrompt;
}

function buildUserPrompt(params: EmailGenerationRequest): string {
  const { recipientCompany, recipientEmail, emailType, additionalContext, industry, companyInfo } = params;

  let prompt = `Generiraj ${getEmailTypeDescription(emailType)} email za:

TVRTKA: ${recipientCompany}
EMAIL: ${recipientEmail}`;

  if (industry) {
    prompt += `\nINDUSTRIJA: ${industry}`;
  }

  if (companyInfo) {
    if (companyInfo.location) prompt += `\nLOKACIJA: ${companyInfo.location}`;
    if (companyInfo.website) prompt += `\nWEBSITE: ${companyInfo.website}`;
    if (companyInfo.rating) prompt += `\nREJTING: ${companyInfo.rating}/5`;
    if (companyInfo.businessType) prompt += `\nTIP POSLOVANJA: ${companyInfo.businessType}`;
  }

  if (additionalContext) {
    prompt += `\nDODATNE INFORMACIJE: ${additionalContext}`;
  }

  prompt += `\n\nPersonaliziraj email specifično za ${recipientCompany} koristeći dostupne informacije o pošiljatelju i primatelju.`;

  return prompt;
}

function getEmailTypeDescription(type: string): string {
  const descriptions = {
    'intro': 'uvodnu prezentaciju',
    'follow-up': 'follow-up',
    'proposal': 'poslovni prijedlog',
    'reminder': 'podsjetnik'
  };
  return descriptions[type as keyof typeof descriptions] || 'personalizirani';
}

function parseGeneratedEmail(text: string): GeneratedEmailContent {
  const lines = text.split('\n');
  let subject = '';
  let content = '';
  let isContent = false;

  for (const line of lines) {
    if (line.startsWith('SUBJECT:')) {
      subject = line.replace('SUBJECT:', '').trim();
    } else if (line.startsWith('CONTENT:')) {
      isContent = true;
      content = line.replace('CONTENT:', '').trim();
    } else if (isContent && line.trim()) {
      content += '\n' + line;
    }
  }

  // Fallback ako parsing ne radi kako treba
  if (!subject || !content) {
    const parts = text.split('\n\n');
    subject = parts[0]?.replace('SUBJECT:', '').trim() || 'Personalizirani prijedlog - Marketing Agent';
    content = parts.slice(1).join('\n\n').replace('CONTENT:', '').trim() || text;
  }

  return { subject, content };
}
