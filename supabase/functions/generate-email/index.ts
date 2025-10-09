import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailGenerationRequest {
  recipientName: string;
  recipientCompany: string;
  recipientIndustry?: string;
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI service not configured');
    }

    // Parse request
    const params: EmailGenerationRequest = await req.json();

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
  const systemPrompt = buildSystemPrompt(params.businessContext);
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

function buildSystemPrompt(businessContext?: string): string {
  let prompt = `Ti si stručnjak za B2B marketing i prodaju. Tvoj zadatak je kreiranje profesionalnih, personaliziranih emailova na hrvatskom jeziku.

VAŽNE SMJERNICE:
- Uvijek piši na hrvatskom jeziku
- Email treba biti profesionalan ali prijateljski ton
- Fokusiraj se na korist za primatelja
- Izbjegavaj klišeje i generičke fraze
- Poruka treba biti jasna i koncizna (max 200 riječi)
- Završi s jasnim pozivom na akciju`;

  if (businessContext) {
    prompt += `\n\nKONTEKST POŠILJATELJA:\n${businessContext}`;
  }

  prompt += `\n\nODGOVOR FORMATIRAJ U TOČNO 2 DIJELA:
SUBJECT: [naslov emaila]
CONTENT: [sadržaj emaila]`;

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

  if (params.additionalContext) {
    prompt += `\n\nDODATNI KONTEKST:\n${params.additionalContext}`;
  }

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

  return { subject, content };
}
