
import { supabase } from '@/integrations/supabase/client';
import { DiscoveredLead } from '@/components/lead-discovery/SearchForm';

export interface AILeadAnalysis {
  score: number; // 1-10 rating
  potential: 'Visok' | 'Srednji' | 'Nizak';
  reasoning: string;
  approach: string;
  keyPoints: string[];
  contactTiming: string;
  priority: number;
}

export interface AnalyzedLead extends DiscoveredLead {
  aiAnalysis?: AILeadAnalysis;
}

export class AILeadAnalysisService {
  private static async callAI(prompt: string, aiSettings: any): Promise<string> {
    if (aiSettings.provider === 'openai') {
      return this.callOpenAI(prompt, aiSettings);
    } else if (aiSettings.provider === 'gemini') {
      return this.callGemini(prompt, aiSettings);
    }
    throw new Error('Unsupported AI provider');
  }

  private static async callOpenAI(prompt: string, aiSettings: any): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiSettings.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiSettings.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: aiSettings.custom_system_prompt || 'You are an expert B2B sales consultant specializing in lead analysis and qualification. Provide detailed, actionable insights.'
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
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private static async callGemini(prompt: string, aiSettings: any): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${aiSettings.api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: (aiSettings.custom_system_prompt || 'You are an expert B2B sales consultant specializing in lead analysis and qualification. Provide detailed, actionable insights.') + '\n\n' + prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  static async analyzeLeads(leads: DiscoveredLead[], userId: string): Promise<AnalyzedLead[]> {
    try {
      // Get AI settings
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('ai_settings')
        .eq('user_id', userId)
        .single();

      if (error || !settings?.ai_settings) {
        throw new Error('AI settings not configured');
      }

      const aiSettings = settings.ai_settings as any;
      
      if (!aiSettings.api_key || !aiSettings.provider) {
        throw new Error('AI API key not configured');
      }

      const analyzedLeads: AnalyzedLead[] = [];

      for (const lead of leads) {
        const prompt = this.createAnalysisPrompt(lead);
        
        try {
          const aiResponse = await this.callAI(prompt, aiSettings);
          const analysis = this.parseAIResponse(aiResponse);
          
          analyzedLeads.push({
            ...lead,
            aiAnalysis: analysis
          });
        } catch (error) {
          console.error(`Error analyzing lead ${lead.name}:`, error);
          // Add lead without analysis if AI fails
          analyzedLeads.push(lead);
        }
      }

      // Sort by AI score (highest first)
      return analyzedLeads.sort((a, b) => {
        const scoreA = a.aiAnalysis?.score || 0;
        const scoreB = b.aiAnalysis?.score || 0;
        return scoreB - scoreA;
      });

    } catch (error) {
      console.error('Error in lead analysis:', error);
      throw error;
    }
  }

  private static createAnalysisPrompt(lead: DiscoveredLead): string {
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

  private static parseAIResponse(response: string): AILeadAnalysis {
    try {
      // Extract JSON from response
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
      // Return default analysis if parsing fails
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
}
