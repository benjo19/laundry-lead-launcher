import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  recipientName: z.string().max(200),
  recipientCompany: z.string().min(1).max(200),
  recipientIndustry: z.string().max(100).optional(),
  recipientLocation: z.string().max(200).optional(),
  recipientWebsite: z.string().max(300).optional(),
  recipientRating: z.number().min(0).max(5).optional(),
  emailType: z.enum(['cold', 'follow-up', 'proposal', 'introduction']),
  additionalContext: z.string().max(2000).optional(),
  businessContext: z.string().max(15000).optional(),
});

interface EmailGenerationRequest {
  recipientName: string;
  recipientCompany: string;
  recipientIndustry?: string;
  recipientLocation?: string;
  recipientWebsite?: string;
  recipientRating?: number;
  emailType: 'cold' | 'follow-up' | 'proposal' | 'introduction';
  additionalContext?: string;
  businessContext?: string;
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

    console.log('Email generation request from user:', user.id);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI service not configured');
    }

    // Validate and parse request
    const rawBody = await req.json();
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

    const params: EmailGenerationRequest = validationResult.data;

    console.log('Generating email with Lovable AI');

    // Generate email using Lovable AI
    const generatedEmail = await generatePersonalizedEmail(params, LOVABLE_API_KEY);

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
        error: error instanceof Error ? error.message : 'Failed to generate email'
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
  apiKey: string
): Promise<GeneratedEmailContent> {
  // Extract custom AI instructions from business context if present
  let customInstructions = '';
  let cleanedBusinessContext = params.businessContext || '';

  if (params.businessContext) {
    // Try to extract "Prilagođene AI upute:" section
    const customInstructionsMatch = params.businessContext.match(/Prilagođene AI upute:\s*(.+?)(?:\n\n|$)/s);
    if (customInstructionsMatch) {
      customInstructions = customInstructionsMatch[1].trim();
      // Remove the custom instructions section from business context to avoid duplication
      cleanedBusinessContext = params.businessContext.replace(/\n\nPrilagođene AI upute:.+?(?=\n\n|$)/s, '');
    }
  }

  console.log('Custom AI instructions extracted:', customInstructions ? 'Yes' : 'No');
  
  const systemPrompt = buildSystemPrompt(cleanedBusinessContext, customInstructions);
  const userPrompt = buildUserPrompt(params);

  try {
    return await generateWithLovableAI(systemPrompt, userPrompt, apiKey);
  } catch (error) {
    console.error('AI Email generation error:', error);
    throw error;
  }
}

async function generateWithLovableAI(
  systemPrompt: string, 
  userPrompt: string, 
  apiKey: string
): Promise<GeneratedEmailContent> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Lovable AI error:', response.status, errorData);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (response.status === 402) {
      throw new Error('AI service requires payment. Please contact support.');
    }
    
    throw new Error('Failed to generate email with AI');
  }

  const data = await response.json();
  const generatedText = data.choices?.[0]?.message?.content;

  if (!generatedText) {
    throw new Error('No content generated from AI');
  }

  return parseGeneratedEmail(generatedText);
}

function buildSystemPrompt(businessContext?: string, customInstructions?: string): string {
  let prompt = '';

  // FIRST: Add critical custom instructions if they exist (highest priority)
  if (customInstructions && customInstructions.trim()) {
    prompt = `⚠️ KRITIČNA PRAVILA - MORA SE BEZUVJETNO POŠTOVATI:

${customInstructions}

================================================================

`;
    console.log('Added critical custom instructions to system prompt');
  }

  // THEN: Add standard instructions
  prompt += `Ti si stručnjak za B2B marketing i prodaju. Tvoj zadatak je kreiranje profesionalnih, personaliziranih emailova na hrvatskom jeziku.

VAŽNE SMJERNICE:
- Uvijek piši na hrvatskom jeziku
- Email treba biti profesionalan ali prijateljski ton
- Fokusiraj se na korist za primatelja
- Izbjegavaj klišeje i generičke fraze
- Poruka treba biti jasna i koncizna (max 200 riječi)
- Završi s jasnim pozivom na akciju
- OBAVEZNO dodaj potpis na kraju emaila ako je naveden u kontekstu pošiljatelja

FORMAT EMAILA:
- Podijeli sadržaj na jasne odlomke
- Svaki odlomak treba biti 2-3 rečenice
- Ostavi praznu liniju između odlomaka
- Koristi pozdravljenje na početku (Poštovani/a...)
- Dodaj potpis na kraju s kontakt informacijama`;

  // FINALLY: Add business context (lowest priority)
  if (businessContext && businessContext.trim()) {
    prompt += `\n\nKONTEKST POŠILJATELJA:\n${businessContext}`;
  }

  prompt += `\n\nODGOVOR FORMATIRAJ U TOČNO 2 DIJELA:
SUBJECT: [naslov emaila]
CONTENT: [sadržaj emaila - podijeli ga u odlomke s praznim linijama između]`;

  return prompt;
}

function buildUserPrompt(params: EmailGenerationRequest): string {
  let prompt = `Generiraj ${getEmailTypeDescription(params.emailType)}.

INFORMACIJE O PRIMATELJU:`;

  if (params.recipientName) {
    prompt += `\nIme: ${params.recipientName}`;
  }
  
  prompt += `\nTvrtka: ${params.recipientCompany}`;

  if (params.recipientIndustry) {
    prompt += `\nIndustrija: ${params.recipientIndustry}`;
  }

  if (params.recipientLocation) {
    prompt += `\nLokacija: ${params.recipientLocation}`;
  }

  if (params.recipientWebsite) {
    prompt += `\nWeb stranica: ${params.recipientWebsite}`;
  }

  if (params.recipientRating !== undefined) {
    prompt += `\nOcjena: ${params.recipientRating}/5`;
  }

  if (params.additionalContext) {
    prompt += `\n\nDODATNI KONTEKST:\n${params.additionalContext}`;
  }

  prompt += `\n\nPERSONALIZIRAJ EMAIL prema dostupnim podacima o primatelju:
- Ako je lokacija poznata, spomeni geografsku blizinu ili specifičnosti tog tržišta
- Ako postoji website, prilagodi pristup prema tipu i veličini poslovanja
- Ako postoji ocjena, prilagodi ton prema reputaciji tvrtke`;

  return prompt;
}

function getEmailTypeDescription(type: string): string {
  const descriptions = {
    'cold': 'uvodni cold email',
    'follow-up': 'follow-up email',
    'proposal': 'email s prijedlogom suradnje',
    'introduction': 'email za predstavljanje'
  };
  return descriptions[type as keyof typeof descriptions] || 'personalizirani email';
}

function parseGeneratedEmail(text: string): GeneratedEmailContent {
  const lines = text.split('\n');
  let subject = '';
  let content = '';
  let inContent = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('SUBJECT:')) {
      subject = trimmedLine.replace('SUBJECT:', '').trim();
    } else if (trimmedLine.startsWith('CONTENT:')) {
      inContent = true;
      const contentStart = trimmedLine.replace('CONTENT:', '').trim();
      if (contentStart) {
        content = contentStart;
      }
    } else if (inContent && trimmedLine) {
      content += (content ? '\n' : '') + trimmedLine;
    } else if (inContent && !trimmedLine) {
      // Preserve empty lines for paragraph breaks
      content += '\n';
    }
  }

  if (!subject || !content) {
    const subjectMatch = text.match(/(?:subject|naslov|predmet):\s*(.+?)(?:\n|$)/i);
    const contentMatch = text.match(/(?:content|sadržaj|poruka):\s*([\s\S]+)/i);
    
    if (subjectMatch) subject = subjectMatch[1].trim();
    if (contentMatch) content = contentMatch[1].trim();
  }

  if (!subject || !content) {
    const parts = text.split('\n\n');
    if (parts.length >= 2) {
      subject = parts[0].replace(/^(SUBJECT|Naslov|Predmet):\s*/i, '').trim();
      content = parts.slice(1).join('\n\n').replace(/^(CONTENT|Sadržaj|Poruka):\s*/i, '').trim();
    } else {
      subject = 'Upit za suradnju';
      content = text;
    }
  }

  // Keep as plain text with clear paragraph breaks (double newlines)
  // Clean up content to ensure consistent paragraph formatting
  const formattedContent = content
    .split('\n\n')  // Split by double newlines (paragraphs)
    .map(para => para.trim().replace(/\n/g, ' '))  // Join single newlines within paragraphs
    .filter(para => para.length > 0)
    .join('\n\n');  // Rejoin with double newlines between paragraphs

  return { 
    subject, 
    content: formattedContent
  };
}
