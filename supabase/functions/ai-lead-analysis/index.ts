import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface DiscoveredLead {
  name: string;
  address: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  website?: string;
  phone?: string;
  email?: string;
  emailScraped?: boolean;
  business_status?: string;
}

interface AILeadAnalysis {
  score: number;
  potential: 'Visok' | 'Srednji' | 'Nizak';
  reasoning: string;
  approach: string;
  keyPoints: string[];
  contactTiming: string;
  priority: number;
}

serve(async (req) => {
  console.log('AI Lead Analysis function called:', req.method);

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

    const { leads } = await req.json();
    
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return new Response(JSON.stringify({ error: 'No leads provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Analyzing ${leads.length} leads with Lovable AI Gateway`);

    const analyzedLeads = [];

    for (const lead of leads) {
      try {
        const analysis = await analyzeLeadWithLovableAI(lead, LOVABLE_API_KEY);
        analyzedLeads.push({
          ...lead,
          aiAnalysis: analysis
        });
      } catch (error) {
        console.error(`Error analyzing lead ${lead.name}:`, error);
        analyzedLeads.push(lead);
      }
    }

    // Sort by AI score (highest first)
    analyzedLeads.sort((a, b) => {
      const scoreA = a.aiAnalysis?.score || 0;
      const scoreB = b.aiAnalysis?.score || 0;
      return scoreB - scoreA;
    });

    return new Response(JSON.stringify({ 
      analyzedLeads,
      count: analyzedLeads.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-lead-analysis function:', error);
    
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

    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeLeadWithLovableAI(lead: DiscoveredLead, apiKey: string): Promise<AILeadAnalysis> {
  const prompt = createAnalysisPrompt(lead);

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
          content: 'Ti si ekspert za B2B prodaju i analizu leadova. Analiziraj leadove i daj konkretne, korisne ocjene potencijala. Odgovori SAMO validnim JSON-om.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI Gateway error:', response.status, errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content;

  if (!aiResponse) {
    throw new Error('No response from AI');
  }

  return parseAIResponse(aiResponse);
}

function createAnalysisPrompt(lead: DiscoveredLead): string {
  return `
Analiziraj sljedeći lead pronađen na Google Maps i ocijeni mu potencijal za marketing/oglašavanje:

INFORMACIJE O LEAD-U:
- Naziv: ${lead.name}
- Lokacija: ${lead.address}
- Tipovi poslovanja: ${lead.types.join(', ')}
- Rating: ${lead.rating || 'N/A'} (${lead.user_ratings_total || 0} recenzija)
- Website: ${lead.website || 'Nema'}
- Telefon: ${lead.phone || 'Nema'}
- Email: ${lead.email || 'Nema'}${lead.emailScraped ? ' (automatski pronađen)' : ''}
- Status poslovanja: ${lead.business_status || 'N/A'}

ZADATAK:
Analiziraj ovaj lead i vrati JSON odgovor u sljedećem formatu:

{
  "score": [1-10 broj],
  "potential": "[Visok/Srednji/Nizak]",
  "reasoning": "[Detaljno objašnjenje zašto je ovaj lead dobar/loš]",
  "approach": "[Preporučeni pristup za kontakt]",
  "keyPoints": ["[ključna točka 1]", "[ključna točka 2]", "[ključna točka 3]"],
  "contactTiming": "[Preporučeno vrijeme za kontakt]",
  "priority": [1-5 broj prioriteta]
}

KRITERIJI ZA OCJENJIVANJE:
- Veličina i tip poslovanja (veći biznis = veći potencijal)
- Prisutnost online (website, rating)
- Lokacija (centar vs. periferija)
- Tip industrije (neki tipovi više troše na marketing)
- Kontakt informacije dostupnost

Odgovori SAMO JSON-om, bez dodatnih objašnjenja.
`;
}

function parseAIResponse(response: string): AILeadAnalysis {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      score: Math.max(1, Math.min(10, parsed.score || 5)),
      potential: ['Visok', 'Srednji', 'Nizak'].includes(parsed.potential) 
        ? parsed.potential : 'Srednji',
      reasoning: parsed.reasoning || 'Analiza nije dostupna',
      approach: parsed.approach || 'Standardni pristup',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      contactTiming: parsed.contactTiming || 'Radnim danima',
      priority: Math.max(1, Math.min(5, parsed.priority || 3))
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      score: 5,
      potential: 'Srednji',
      reasoning: 'AI analiza nije uspješno završena',
      approach: 'Kontaktirajte standardnim pristupom',
      keyPoints: ['Provjerite dodatne informacije', 'Personalizirajte pristup'],
      contactTiming: 'Radnim danima',
      priority: 3
    };
  }
}
